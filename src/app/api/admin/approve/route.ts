import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { submissionId } = await request.json();

    if (!submissionId || typeof submissionId !== "string") {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    const submission = await prisma.paymentSubmission.findUnique({
      where: { id: submissionId },
      include: { plan: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (submission.status !== "PENDING") {
      return NextResponse.json({ error: "Submission already processed" }, { status: 400 });
    }

    const now = new Date();
    const resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.paymentSubmission.update({
      where: { id: submissionId },
      data: { status: "APPROVED" },
    });

    await prisma.subscription.upsert({
      where: { orgId: submission.orgId },
      create: {
        orgId: submission.orgId,
        status: "active",
        planId: submission.planId,
        currentPeriodStart: now,
        currentPeriodEnd: resetAt,
        usageResetDate: resetAt,
      },
      update: {
        status: "active",
        planId: submission.planId,
        currentPeriodStart: now,
        currentPeriodEnd: resetAt,
        usageResetDate: resetAt,
        currentUsageCharacters: 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json(
        { error: error.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 },
      );
    }
    logger.error({ error }, "Admin approve failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
