import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { clerkClient } from "@clerk/nextjs/server";
import { notifyAll } from "@/lib/notifications";
import {
  approvePaymentSubmission,
  toManualPaymentHttpError,
} from "@/lib/manual-payments";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    const body: unknown = await request.json();
    const submissionId =
      typeof body === "object" && body !== null && "submissionId" in body
        ? (body as { submissionId?: unknown }).submissionId
        : undefined;
    const adminNotes =
      typeof body === "object" && body !== null && "adminNotes" in body
        ? (body as { adminNotes?: unknown }).adminNotes
        : undefined;

    if (!submissionId || typeof submissionId !== "string") {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 },
      );
    }

    const payment = await approvePaymentSubmission({
      paymentId: submissionId,
      admin,
      note: typeof adminNotes === "string" ? adminNotes : undefined,
    });

    // Fire approval notification in the background
    if (payment.plan) {
      void (async () => {
        try {
          const client = await clerkClient();
          let userName = "Unknown";
          let userEmail = "unknown";
          try {
            const user = await client.users.getUser(payment.userId);
            userEmail =
              user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
              user.emailAddresses[0]?.emailAddress ?? "unknown";
            userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Unknown";
          } catch { /* ignore */ }
          await notifyAll({
            event: "PAYMENT_APPROVED",
            userName,
            userEmail,
            timestamp: new Date(),
            paymentAmount: payment.amount,
            paymentPlan: payment.plan.name,
            paymentReference: payment.paymentReference ?? payment.id,
          });
        } catch (err) {
          logger.error({ err }, "Failed to send approval notification");
        }
      })();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const mapped = toManualPaymentHttpError(error);
    if (mapped.status >= 500) {
      logger.error({ error }, "Admin approve failed");
    }
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status },
    );
  }
}
