import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { uploadProofImage } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { notifyAll } from "@/lib/notifications";
import { rateLimitOp } from "@/lib/rate-limit";
import {
  createUniquePaymentReference,
  hasValidImageSignature,
  isValidPaymentReference,
  isAllowedProofMimeType,
  PAYMENT_PROOF_MAX_BYTES,
  sanitizeText,
} from "@/lib/manual-payments";

export async function POST(request: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (request.headers.get("x-kingstalk-action") !== "manual-payment-submit") {
      return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    }

    const rl = await rateLimitOp("payment", `${userId}:${orgId}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before submitting again." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        },
      );
    }

    const formData = await request.formData();
    const planId = sanitizeText(String(formData.get("planId") ?? ""), 80);
    const senderName = sanitizeText(
      String(formData.get("senderName") ?? ""),
      120,
    );
    const senderAccountNumber = sanitizeText(
      String(formData.get("senderAccountNumber") ?? ""),
      30,
    );
    const bankName = sanitizeText(String(formData.get("bankName") ?? ""), 120);
    const transferReference = sanitizeText(
      String(formData.get("reference") ?? ""),
      120,
    );
    const submittedPaymentReference = sanitizeText(
      String(formData.get("paymentReference") ?? ""),
      80,
    );
    const proofFileValue = formData.get("proofFile");
    const proofFile = proofFileValue instanceof File ? proofFileValue : null;

    if (!planId || !senderName || !senderAccountNumber || !bankName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!/^\d{6,20}$/.test(senderAccountNumber)) {
      return NextResponse.json(
        { error: "Sender account number must contain 6 to 20 digits" },
        { status: 400 },
      );
    }

    if (!proofFile) {
      return NextResponse.json(
        { error: "Payment proof file is required" },
        { status: 400 },
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.price <= 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const existingPending = await prisma.paymentSubmission.findFirst({
      where: { orgId, status: "PENDING", deletedAt: null },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending payment awaiting review" },
        { status: 409 },
      );
    }

    if (proofFile.size > PAYMENT_PROOF_MAX_BYTES) {
      return NextResponse.json(
        { error: "File size must be 5MB or less" },
        { status: 400 },
      );
    }

    if (!isAllowedProofMimeType(proofFile.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 },
      );
    }

    const arrayBuffer = await proofFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!hasValidImageSignature(buffer, proofFile.type)) {
      return NextResponse.json(
        { error: "The uploaded file does not match its image type" },
        { status: 400 },
      );
    }

    const proofHash = createHash("sha256").update(buffer).digest("hex");
    // P0-3: Global cross-org duplicate proof check — not scoped to orgId.
    // Policy: PENDING or APPROVED proof hashes are permanently blocked system-wide.
    // REJECTED submissions may be resubmitted with a fresh proof image.
    const duplicateProof = await prisma.paymentSubmission.findFirst({
      where: {
        proofHash,
        deletedAt: null,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (duplicateProof) {
      return NextResponse.json(
        { error: "This payment proof has already been submitted" },
        { status: 409 },
      );
    }

    if (
      submittedPaymentReference &&
      !isValidPaymentReference(submittedPaymentReference)
    ) {
      return NextResponse.json(
        { error: "Invalid payment reference. Refresh the page and try again." },
        { status: 400 },
      );
    }

    const paymentReference =
      submittedPaymentReference || (await createUniquePaymentReference());
    const existingReference = await prisma.paymentSubmission.findUnique({
      where: { paymentReference },
      select: { id: true },
    });

    if (existingReference) {
      return NextResponse.json(
        {
          error:
            "Payment reference has already been used. Refresh and try again.",
        },
        { status: 409 },
      );
    }

    const extension =
      proofFile.type === "image/png"
        ? "png"
        : proofFile.type === "image/webp"
          ? "webp"
          : "jpg";
    const fileName = `payment-proofs/${orgId}/${paymentReference}-${randomUUID()}.${extension}`;

    await uploadProofImage(buffer, fileName, proofFile.type);
    const proofImageUrl = fileName;

    const payment = await prisma.paymentSubmission.create({
      data: {
        userId,
        orgId,
        planId,
        amount: plan.price,
        accountName: senderName,
        senderAccountNumber,
        bankName,
        transferReference,
        paymentReference,
        proofImageUrl,
        proofHash,
        status: "PENDING",
      },
      include: { plan: true },
    });

    // Fire admin notifications in the background
    void (async () => {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const userName =
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          clerkUser.username ||
          "Unknown user";
        const userEmail =
          clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress ??
          clerkUser.emailAddresses[0]?.emailAddress ??
          "Unknown";

        await notifyAll({
          event: "PAYMENT_INITIATED",
          userName,
          userEmail,
          timestamp: new Date(),
          paymentAmount: payment.amount,
          paymentPlan: payment.plan.name,
          paymentReference: payment.paymentReference ?? payment.id,
        });
      } catch (err) {
        logger.error({ err }, "Failed to send payment notification");
      }
    })();

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        plan: payment.plan,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    logger.error({ error }, "Manual payment submit failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
