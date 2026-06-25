import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, orgProcedure } from "../init";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const manualPaymentsRouter = createTRPCRouter({
  // User gets their payment history
  getMyPayments: orgProcedure.query(async ({ ctx }) => {
    const payments = await prisma.paymentSubmission.findMany({
      where: { orgId: ctx.orgId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return payments;
  }),

  // Get payment instructions
  getPaymentInstructions: orgProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ ctx, input }) => {
      const plan = await prisma.plan.findUnique({
        where: { id: input.planId },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      return {
        accountName: env.BANK_ACCOUNT_NAME,
        accountNumber: env.BANK_ACCOUNT_NUMBER,
        bankName: env.BANK_NAME,
        amount: plan.price,
        planName: plan.name,
        planId: plan.id,
      };
    }),
});
