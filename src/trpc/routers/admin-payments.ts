import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { PaymentStatus, Prisma } from "@/generated/prisma";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { notifyAll } from "@/lib/notifications";
import { getSignedUrlForKey } from "@/lib/r2";
import {
  addPaymentAdminNote,
  approvePaymentSubmission,
  deleteInvalidPaymentSubmission,
  recordPaymentExport,
  rejectPaymentSubmission,
  sanitizeText,
} from "@/lib/manual-payments";
import { authProcedure, createTRPCRouter } from "../init";

type AdminActor = {
  userId: string;
  email: string;
};

const paymentStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
const sortSchema = z.enum(["newest", "oldest", "amount-high", "amount-low"]);

async function requireAdminTRPC(userId: string): Promise<AdminActor> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email =
    user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  if (!email || email !== env.ADMIN_EMAIL) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied. Admin only.",
    });
  }

  return { userId, email };
}

async function resolveProofUrl(
  proofImageUrl: string | null,
): Promise<string | null> {
  if (!proofImageUrl) return null;
  if (proofImageUrl.startsWith("http")) return proofImageUrl;
  try {
    return await getSignedUrlForKey(proofImageUrl, 86400);
  } catch {
    return null;
  }
}

async function getUserDirectory(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds));
  const client = await clerkClient();
  const entries = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const user = await client.users.getUser(userId);
        const email =
          user.emailAddresses.find(
            (entry) => entry.id === user.primaryEmailAddressId,
          )?.emailAddress ??
          user.emailAddresses[0]?.emailAddress ??
          "Unknown";
        const name =
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.username ||
          "Unknown user";
        return [userId, { email, name }] as const;
      } catch {
        return [userId, { email: "Unknown", name: "Unknown user" }] as const;
      }
    }),
  );
  return new Map(entries);
}

function escapeCsvCell(
  value: string | number | Date | null | undefined,
): string {
  const stringValue =
    value instanceof Date ? value.toISOString() : String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function matchesPaymentSearch(
  payment: {
    userId: string;
    accountName: string;
    transferReference: string;
    paymentReference: string | null;
  },
  user: { email: string; name: string },
  search: string,
): boolean {
  if (!search) return true;
  const normalized = search.toLowerCase();
  return [
    user.email,
    user.name,
    payment.userId,
    payment.accountName,
    payment.transferReference,
    payment.paymentReference ?? "",
  ].some((value) => value.toLowerCase().includes(normalized));
}

export const adminPaymentsRouter = createTRPCRouter({
  getAllPayments: authProcedure
    .input(
      z
        .object({
          status: paymentStatusSchema.optional(),
          planId: z.string().optional(),
          search: z.string().optional(),
          dateFrom: z.coerce.date().optional(),
          dateTo: z.coerce.date().optional(),
          sort: sortSchema.default("newest"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }: any) => {
      await requireAdminTRPC(ctx.userId);

      const where: Prisma.PaymentSubmissionWhereInput = {
        deletedAt: null,
        status: input?.status,
        planId: input?.planId || undefined,
        createdAt:
          input?.dateFrom || input?.dateTo
            ? {
                gte: input.dateFrom,
                lte: input.dateTo ? endOfDay(input.dateTo) : undefined,
              }
            : undefined,
      };

      const search = input?.search ? sanitizeText(input.search, 120) : "";

      const orderBy: Prisma.PaymentSubmissionOrderByWithRelationInput =
        input?.sort === "oldest"
          ? { createdAt: "asc" }
          : input?.sort === "amount-high"
            ? { amount: "desc" }
            : input?.sort === "amount-low"
              ? { amount: "asc" }
              : { createdAt: "desc" };

      const payments = await prisma.paymentSubmission.findMany({
        where,
        include: {
          plan: true,
          auditLogs: { orderBy: { createdAt: "desc" } },
        },
        orderBy,
      });

      const users = await getUserDirectory(
        payments.map((payment) => payment.userId),
      );

      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          const user = users.get(payment.userId) ?? {
            email: "Unknown",
            name: "Unknown user",
          };
          return {
            ...payment,
            userEmail: user.email,
            userName: user.name,
            proofImageUrl: await resolveProofUrl(payment.proofImageUrl),
          };
        }),
      );

      return enrichedPayments.filter((payment) =>
        matchesPaymentSearch(
          payment,
          { email: payment.userEmail, name: payment.userName },
          search,
        ),
      );
    }),

  getPaymentById: authProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }: any) => {
      await requireAdminTRPC(ctx.userId);

      const payment = await prisma.paymentSubmission.findUnique({
        where: { id: input.id },
        include: {
          plan: true,
          auditLogs: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!payment || payment.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      const users = await getUserDirectory([payment.userId]);
      const user = users.get(payment.userId) ?? {
        email: "Unknown",
        name: "Unknown user",
      };

      return {
        ...payment,
        userEmail: user.email,
        userName: user.name,
        proofImageUrl: await resolveProofUrl(payment.proofImageUrl),
      };
    }),

  approvePayment: authProcedure
    .input(
      z.object({
        paymentId: z.string(),
        adminNotes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }: any) => {
      const admin = await requireAdminTRPC(ctx.userId);
      const payment = await approvePaymentSubmission({
        paymentId: input.paymentId,
        admin,
        note: input.adminNotes,
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
              paymentPlan: payment.plan!.name,
              paymentReference: payment.paymentReference ?? payment.id,
            });
          } catch (err) {
            logger.error({ err }, "Failed to send approval notification");
          }
        })();
      }

      return { success: true, payment };
    }),

  rejectPayment: authProcedure
    .input(
      z.object({
        paymentId: z.string(),
        rejectionReason: z
          .string()
          .min(1, "Rejection reason is required")
          .max(1000),
        adminNotes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }: any) => {
      const admin = await requireAdminTRPC(ctx.userId);
      const payment = await rejectPaymentSubmission({
        paymentId: input.paymentId,
        admin,
        reason: input.rejectionReason,
        note: input.adminNotes,
      });

      return { success: true, payment };
    }),

  addNote: authProcedure
    .input(
      z.object({ paymentId: z.string(), note: z.string().min(1).max(1000) }),
    )
    .mutation(async ({ ctx, input }: any) => {
      const admin = await requireAdminTRPC(ctx.userId);
      const payment = await addPaymentAdminNote({
        paymentId: input.paymentId,
        admin,
        note: input.note,
      });
      return { success: true, payment };
    }),

  deleteInvalid: authProcedure
    .input(
      z.object({ paymentId: z.string(), reason: z.string().min(1).max(1000) }),
    )
    .mutation(async ({ ctx, input }: any) => {
      const admin = await requireAdminTRPC(ctx.userId);
      const payment = await deleteInvalidPaymentSubmission({
        paymentId: input.paymentId,
        admin,
        reason: input.reason,
      });
      return { success: true, payment };
    }),

  exportPayments: authProcedure
    .input(
      z
        .object({
          status: paymentStatusSchema.optional(),
          planId: z.string().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }: any) => {
      const admin = await requireAdminTRPC(ctx.userId);
      const where: Prisma.PaymentSubmissionWhereInput = {
        deletedAt: null,
        status: input?.status,
        planId: input?.planId || undefined,
      };

      const search = input?.search ? sanitizeText(input.search, 120) : "";

      const payments = await prisma.paymentSubmission.findMany({
        where,
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });

      const users = await getUserDirectory(
        payments.map((payment) => payment.userId),
      );
      const header = [
        "User",
        "Email",
        "User ID",
        "Plan",
        "Amount",
        "Status",
        "Payment Reference",
        "Submitted",
      ];
      const filteredPayments = payments.filter((payment) => {
        const user = users.get(payment.userId) ?? {
          email: "Unknown",
          name: "Unknown user",
        };
        return matchesPaymentSearch(payment, user, search);
      });

      const rows = filteredPayments.map((payment) => {
        const user = users.get(payment.userId) ?? {
          email: "Unknown",
          name: "Unknown user",
        };
        return [
          user.name,
          user.email,
          payment.userId,
          payment.plan.name,
          payment.amount,
          payment.status,
          payment.paymentReference ?? "",
          payment.createdAt,
        ];
      });

      await recordPaymentExport({
        admin,
        count: filteredPayments.length,
        filters: {
          status: input?.status ?? null,
          planId: input?.planId ?? null,
          search: input?.search ?? null,
        },
      });

      return {
        filename: `kingstalk-payments-${new Date().toISOString().slice(0, 10)}.csv`,
        csv: [header, ...rows]
          .map((row) => row.map(escapeCsvCell).join(","))
          .join("\n"),
      };
    }),

  getStats: authProcedure.query(async ({ ctx }: any) => {
    await requireAdminTRPC(ctx.userId);

    const [total, pending, approved, rejected, totalRevenue] =
      await Promise.all([
        prisma.paymentSubmission.count({ where: { deletedAt: null } }),
        prisma.paymentSubmission.count({
          where: { status: "PENDING", deletedAt: null },
        }),
        prisma.paymentSubmission.count({
          where: { status: "APPROVED", deletedAt: null },
        }),
        prisma.paymentSubmission.count({
          where: { status: "REJECTED", deletedAt: null },
        }),
        prisma.paymentSubmission.aggregate({
          where: { status: "APPROVED", deletedAt: null },
          _sum: { amount: true },
        }),
      ]);

    const byStatus: Record<PaymentStatus, number> = {
      PENDING: pending,
      APPROVED: approved,
      REJECTED: rejected,
    };

    return {
      total,
      pending: byStatus.PENDING,
      approved: byStatus.APPROVED,
      rejected: byStatus.REJECTED,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    };
  }),
});
