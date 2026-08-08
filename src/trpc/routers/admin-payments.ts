import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { PaymentStatus, Prisma } from "@/generated/prisma";
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
import { adminProcedure, createTRPCRouter, getAdminActor, _t } from "../init";

const paymentStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
const sortSchema = z.enum(["newest", "oldest", "amount-high", "amount-low"]);

const MAX_PAGE_SIZE = 100;

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
  getAllPayments: adminProcedure
    .input(
      z
        .object({
          status: paymentStatusSchema.optional(),
          planId: z.string().trim().optional(),
          search: z.string().trim().optional(),
          dateFrom: z.coerce.date().optional(),
          dateTo: z.coerce.date().optional(),
          sort: sortSchema.default("newest"),
          cursor: z.string().optional(),
          limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
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
        ...(input?.cursor
          ? { id: { lt: input.cursor } }
          : {}),
      };

      const search = input?.search ? sanitizeText(input.search, 120) : "";
      const limit = Math.min(input?.limit ?? 50, MAX_PAGE_SIZE);

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
          auditLogs: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy,
        take: limit + 1,
      });

      const hasNextPage = payments.length > limit;
      const pagePayments = hasNextPage ? payments.slice(0, -1) : payments;
      const nextCursor = hasNextPage ? pagePayments[pagePayments.length - 1].id : null;

      const users = await getUserDirectory(
        pagePayments.map((payment) => payment.userId),
      );

      const enrichedPayments = await Promise.all(
        pagePayments.map(async (payment) => {
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

      return {
        items: enrichedPayments.filter((payment) =>
          matchesPaymentSearch(
            payment,
            { email: payment.userEmail, name: payment.userName },
            search,
          ),
        ),
        nextCursor,
      };
    }),

  getPaymentById: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
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

  approvePayment: adminProcedure
    .input(
      z.object({
        paymentId: z.string().min(1),
        adminNotes: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await getAdminActor(ctx);
      const payment = await approvePaymentSubmission({
        paymentId: input.paymentId,
        admin,
        note: input.adminNotes,
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
        }
        if (msg === "ALREADY_PROCESSED") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment already processed" });
        }
        logger.error({ error: err, paymentId: input.paymentId }, "Payment approval failed");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment approval failed" });
      });

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

      return { success: true, payment };
    }),

  rejectPayment: adminProcedure
    .input(
      z.object({
        paymentId: z.string().min(1),
        rejectionReason: z
          .string()
          .trim()
          .min(1, "Rejection reason is required")
          .max(1000),
        adminNotes: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await getAdminActor(ctx);
      const payment = await rejectPaymentSubmission({
        paymentId: input.paymentId,
        admin,
        reason: input.rejectionReason,
        note: input.adminNotes,
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
        }
        if (msg === "ALREADY_PROCESSED") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment already processed" });
        }
        logger.error({ error: err, paymentId: input.paymentId }, "Payment rejection failed");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment rejection failed" });
      });

      return { success: true, payment };
    }),

  addNote: adminProcedure
    .input(
      z.object({ paymentId: z.string().min(1), note: z.string().trim().min(1).max(1000) }),
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await getAdminActor(ctx);
      const payment = await addPaymentAdminNote({
        paymentId: input.paymentId,
        admin,
        note: input.note,
      }).catch((err: unknown) => {
        logger.error({ error: err, paymentId: input.paymentId }, "Payment note failed");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add admin note" });
      });
      return { success: true, payment };
    }),

  deleteInvalid: adminProcedure
    .input(
      z.object({ paymentId: z.string().min(1), reason: z.string().trim().min(1).max(1000) }),
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await getAdminActor(ctx);
      const payment = await deleteInvalidPaymentSubmission({
        paymentId: input.paymentId,
        admin,
        reason: input.reason,
      }).catch((err: unknown) => {
        logger.error({ error: err, paymentId: input.paymentId }, "Payment deletion failed");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete payment submission" });
      });
      return { success: true, payment };
    }),

  exportPayments: adminProcedure
    .input(
      z
        .object({
          status: paymentStatusSchema.optional(),
          planId: z.string().trim().optional(),
          search: z.string().trim().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await getAdminActor(ctx);
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
        take: 10_000,
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

  getStats: adminProcedure.query(async () => {
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

export { _t as t };
