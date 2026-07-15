import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";
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

    await approvePaymentSubmission({
      paymentId: submissionId,
      admin,
      note: typeof adminNotes === "string" ? adminNotes : undefined,
    });

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
