/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "./db";

export function createUniquePaymentReference(): string {
  return `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function toManualPaymentHttpError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED")
      return { status: 401, message: "Unauthorized" };
    if (error.message === "FORBIDDEN")
      return { status: 403, message: "Forbidden" };
    if (error.message === "NOT_FOUND")
      return { status: 404, message: "Not found" };
    if (error.message === "ALREADY_PROCESSED")
      return { status: 400, message: "Payment already processed" };
  }
  return { status: 500, message: "Internal server error" };
}

interface AdminInfo {
  userId: string;
  email: string;
}

export async function approvePaymentSubmission({
  paymentId,
  admin,
  note,
}: {
  paymentId: string;
  admin: AdminInfo;
  note?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const submission = await tx.paymentSubmission.findUnique({
      where: { id: paymentId },
      include: { plan: true },
    });

    if (!submission) throw new Error("NOT_FOUND");
    if (submission.status !== "PENDING") throw new Error("ALREADY_PROCESSED");

    const updated = await tx.paymentSubmission.update({
      where: { id: paymentId },
      data: {
        status: "APPROVED",
        reviewedBy: admin.userId,
        reviewedAt: new Date(),
        adminNote: note,
      },
      include: { plan: true },
    });

    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await tx.subscription.upsert({
      where: { orgId: submission.orgId },
      create: {
        orgId: submission.orgId,
        status: "active",
        planId: submission.planId,
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        usageResetDate: endDate,
        currentUsageCharacters: 0,
        currentUsageGenerations: 0,
      },
      update: {
        status: "active",
        planId: submission.planId,
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
        usageResetDate: endDate,
        currentUsageCharacters: 0,
        currentUsageGenerations: 0,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "APPROVE_PAYMENT",
        entityType: "PaymentSubmission",
        entityId: paymentId,
        adminUserId: admin.userId,
        adminEmail: admin.email,
        reason: note,
        paymentId,
      },
    });

    return updated;
  });
}

export async function rejectPaymentSubmission({
  paymentId,
  admin,
  reason,
  note,
}: {
  paymentId: string;
  admin: AdminInfo;
  reason: string;
  note?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const submission = await tx.paymentSubmission.findUnique({
      where: { id: paymentId },
    });

    if (!submission) throw new Error("NOT_FOUND");
    if (submission.status !== "PENDING") throw new Error("ALREADY_PROCESSED");

    const updated = await tx.paymentSubmission.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED",
        reviewedBy: admin.userId,
        reviewedAt: new Date(),
        adminNote: note || reason,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "REJECT_PAYMENT",
        entityType: "PaymentSubmission",
        entityId: paymentId,
        adminUserId: admin.userId,
        adminEmail: admin.email,
        reason: note || reason,
        paymentId,
      },
    });

    return updated;
  });
}

export const PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024;

export function hasValidImageSignature(buffer: Buffer, type: string): boolean {
  if (buffer.length < 12) return false;

  const header = buffer.toString("hex", 0, 12);

  switch (type) {
    case "image/jpeg":
      return header.startsWith("ffd8ff");

    case "image/png":
      return header.startsWith("89504e470d0a1a0a");

    case "image/webp":
      return (
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      );

    default:
      return false;
  }
}

export function isValidPaymentReference(ref: string): boolean {
  return /^[a-zA-Z0-9-_]{5,50}$/.test(ref);
}

export function isAllowedProofMimeType(mime: string): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(mime);
}

export function sanitizeText(text: string, maxLength: number = 1000): string {
  const sanitized = text.replace(/[<>]/g, "").trim();
  return sanitized.length > maxLength
    ? sanitized.substring(0, maxLength)
    : sanitized;
}

export async function addPaymentAdminNote({
  paymentId,
  admin,
  note,
}: {
  paymentId: string;
  admin: AdminInfo;
  note: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const updated = await tx.paymentSubmission.update({
      where: { id: paymentId },
      data: { adminNote: note },
    });
    await tx.auditLog.create({
      data: {
        action: "ADD_NOTE",
        entityType: "PaymentSubmission",
        entityId: paymentId,
        adminUserId: admin.userId,
        adminEmail: admin.email,
        reason: note,
        paymentId,
      },
    });
    return updated;
  });
}

export async function deleteInvalidPaymentSubmission({
  paymentId,
  admin,
  reason,
}: {
  paymentId: string;
  admin: AdminInfo;
  reason: string;
}) {
  return await prisma.$transaction(async (tx) => {
    const updated = await tx.paymentSubmission.update({
      where: { id: paymentId },
      data: { deletedAt: new Date(), adminNote: reason },
    });
    await tx.auditLog.create({
      data: {
        action: "DELETE_PAYMENT",
        entityType: "PaymentSubmission",
        entityId: paymentId,
        adminUserId: admin.userId,
        adminEmail: admin.email,
        reason: reason,
        paymentId,
      },
    });
    return updated;
  });
}

export async function recordPaymentExport({
  admin,
  filters,
  count,
}: {
  admin: AdminInfo;
  filters: any;
  count: number;
}) {
  return await prisma.auditLog.create({
    data: {
      action: "EXPORT_PAYMENTS",
      entityType: "PaymentSubmission",
      entityId: "BULK",
      adminUserId: admin.userId,
      adminEmail: admin.email,
      metadata: JSON.stringify({ filters, count }),
    },
  });
}
