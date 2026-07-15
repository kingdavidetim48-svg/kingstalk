import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { rejectPaymentSubmission, toManualPaymentHttpError } from "@/lib/manual-payments";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    const body: unknown = await request.json();
    const submissionId = typeof body === "object" && body !== null && "submissionId" in body
      ? (body as { submissionId?: unknown }).submissionId
      : undefined;
    const reason = typeof body === "object" && body !== null && "reason" in body
      ? (body as { reason?: unknown }).reason
      : undefined;

    if (!submissionId || typeof submissionId !== "string") {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    await rejectPaymentSubmission({ paymentId: submissionId, admin, reason });

    return NextResponse.json({ success: true });
  } catch (error) {
    const mapped = toManualPaymentHttpError(error);
    if (mapped.status >= 500) {
      logger.error({ error }, "Admin reject failed");
    }
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
