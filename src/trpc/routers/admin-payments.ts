import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, orgProcedure } from "../init";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getSignedUrlForKey } from "@/lib/r2";
import { clerkClient } from "@clerk/nextjs/server";

async function requireAdminTRPC(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;
  if (!userEmail || userEmail !== env.ADMIN_EMAIL) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Admin only.",
    });
  }
  return user;
}

async function resolveProofUrl(proofImageUrl: string | null): Promise<string | null> {
  if (!proofImageUrl) return null;
  if (proofImageUrl.startsWith("http")) return proofImageUrl;
  try {
    return await getSignedUrlForKey(proofImageUrl, 86400);
  } catch {
    return null;
  }
}

export const adminPaymentsRouter = createTRPCRouter({
  // Get all payments (admin only)
  getAllPayments: orgProcedure.query(async ({ ctx }) => {
    await requireAdminTRPC(ctx.userId);

    const payments = await prisma.paymentSubmission.findMany({
      include: {
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(
      payments.map(async (p) => ({
        ...p,
        proofImageUrl: await resolveProofUrl(p.proofImageUrl),
      })),
    );
  }),

  // Get payment by ID (admin only)
  getPaymentById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await requireAdminTRPC(ctx.userId);

      const payment = await prisma.paymentSubmission.findUnique({
        where: { id: input.id },
        include: {
          plan: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      return {
        ...payment,
        proofImageUrl: await resolveProofUrl(payment.proofImageUrl),
      };
    }),

  // Approve payment (admin only)
  approvePayment: orgProcedure
    .input(
      z.object({
        paymentId: z.string(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await requireAdminTRPC(ctx.userId);

      // Get payment
      const payment = await prisma.paymentSubmission.findUnique({
        where: { id: input.paymentId },
        include: { plan: true },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      if (payment.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment is not in pending status",
        });
      }

      const adminEmail = user.emailAddresses[0]?.emailAddress || "unknown";

      // Update payment status
      const updatedPayment = await prisma.paymentSubmission.update({
        where: { id: input.paymentId },
        data: {
          status: "APPROVED",
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "approve",
          entityType: "PaymentSubmission",
          entityId: input.paymentId,
          adminUserId: ctx.userId,
          adminEmail,
          reason: input.adminNotes,
          metadata: JSON.stringify({ amount: payment.amount, planId: payment.planId }),
        },
      });

      // Activate subscription
      const now = new Date();
      const resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.subscription.upsert({
        where: { orgId: payment.orgId },
        create: {
          orgId: payment.orgId,
          status: "active",
          planId: payment.planId,
          currentPeriodStart: now,
          currentPeriodEnd: resetAt,
          usageResetDate: resetAt,
        },
        update: {
          status: "active",
          planId: payment.planId,
          currentPeriodStart: now,
          currentPeriodEnd: resetAt,
          usageResetDate: resetAt,
          currentUsageCharacters: 0,
        },
      });

      return {
        success: true,
        payment: updatedPayment,
      };
    }),

  // Reject payment (admin only)
  rejectPayment: orgProcedure
    .input(
      z.object({
        paymentId: z.string(),
        rejectionReason: z.string().min(1, "Rejection reason is required"),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await requireAdminTRPC(ctx.userId);

      const payment = await prisma.paymentSubmission.findUnique({
        where: { id: input.paymentId },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      if (payment.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment is not in pending status",
        });
      }

      const adminEmail = user.emailAddresses[0]?.emailAddress || "unknown";

      const updatedPayment = await prisma.paymentSubmission.update({
        where: { id: input.paymentId },
        data: {
          status: "REJECTED",
          adminNote: input.rejectionReason,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "reject",
          entityType: "PaymentSubmission",
          entityId: input.paymentId,
          adminUserId: ctx.userId,
          adminEmail,
          reason: input.rejectionReason,
          metadata: JSON.stringify({ amount: payment.amount, planId: payment.planId }),
        },
      });

      return {
        success: true,
        payment: updatedPayment,
      };
    }),

  // Get payment statistics (admin only)
  getStats: orgProcedure.query(async ({ ctx }) => {
    await requireAdminTRPC(ctx.userId);

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.paymentSubmission.count(),
      prisma.paymentSubmission.count({ where: { status: "PENDING" } }),
      prisma.paymentSubmission.count({ where: { status: "APPROVED" } }),
      prisma.paymentSubmission.count({ where: { status: "REJECTED" } }),
    ]);

    const totalRevenue = await prisma.paymentSubmission.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    });

    return {
      total,
      pending,
      approved,
      rejected,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }),
});
