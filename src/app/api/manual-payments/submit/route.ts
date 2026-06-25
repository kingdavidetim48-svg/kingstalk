import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getSignedUrlForKey, uploadProofImage } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { userId, orgId } = await auth();

    const rl = rateLimit(`payment-submit:${userId}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const planId = formData.get("planId") as string;
    const senderName = formData.get("senderName") as string;
    const senderAccountNumber = formData.get("senderAccountNumber") as string;
    const bankName = formData.get("bankName") as string;
    const reference = formData.get("reference") as string | null;
    const proofFile = formData.get("proofFile") as File | null;

    if (!planId || !senderName || !senderAccountNumber || !bankName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!proofFile) {
      return NextResponse.json(
        { error: "Payment proof file is required" },
        { status: 400 }
      );
    }

    const existingPending = await prisma.paymentSubmission.findFirst({
      where: { orgId, planId, status: "PENDING" },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have a pending payment for this plan" },
        { status: 409 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

    if (proofFile.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(proofFile.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and PDF files are allowed" },
        { status: 400 }
      );
    }

    const fileExtension = proofFile.name.split(".").pop();
    const fileName = `payment-proofs/${orgId}/${Date.now()}.${fileExtension}`;

    const arrayBuffer = await proofFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadProofImage(buffer, fileName, proofFile.type);

    const proofImageUrl = fileName;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    const payment = await prisma.paymentSubmission.create({
      data: {
        userId,
        orgId,
        planId,
        amount: plan.price,
        accountName: senderName,
        bankName,
        transferReference: reference || "",
        proofImageUrl,
        status: "PENDING",
      },
      include: { plan: true },
    });

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
      { status: 500 }
    );
  }
}
