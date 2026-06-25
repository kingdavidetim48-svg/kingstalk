import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { createTRPCRouter, orgProcedure } from "../init";

export const billingRouter = createTRPCRouter({
  getStatus: orgProcedure.query(async ({ ctx }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { orgId: ctx.orgId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== "active") {
      return {
        hasActiveSubscription: false,
        plan: null,
        currentPeriodEnd: null,
        usage: null,
      };
    }

    return {
      hasActiveSubscription: true,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        maxCustomVoices: subscription.plan.maxCustomVoices,
        perGenerationCharacterLimit: subscription.plan.perGenerationCharacterLimit,
        monthlyCharacterLimit: subscription.plan.monthlyCharacterLimit,
        premiumVoices: subscription.plan.premiumVoices,
        apiAccess: subscription.plan.apiAccess,
        teamCollaboration: subscription.plan.teamCollaboration,
      },
      currentPeriodEnd: subscription.currentPeriodEnd,
      usage: {
        currentUsageCharacters: subscription.currentUsageCharacters,
        usageResetDate: subscription.usageResetDate,
      },
    };
  }),

  listPlans: orgProcedure.query(async () => {
    const plans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
    });
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      maxCustomVoices: p.maxCustomVoices,
      perGenerationCharacterLimit: p.perGenerationCharacterLimit,
      monthlyCharacterLimit: p.monthlyCharacterLimit,
      premiumVoices: p.premiumVoices,
      apiAccess: p.apiAccess,
      teamCollaboration: p.teamCollaboration,
    }));
  }),

  getBankDetails: orgProcedure.query(async () => {
    return {
      bankName: env.BANK_NAME,
      accountName: env.BANK_ACCOUNT_NAME,
      accountNumber: env.BANK_ACCOUNT_NUMBER,
    };
  }),

  submitPayment: orgProcedure
    .input(
      z.object({
        planId: z.string().min(1),
        accountName: z.string().min(1, "Account name is required"),
        bankName: z.string().min(1, "Bank name is required"),
        transferReference: z.string().min(1, "Transfer reference is required"),
        proofImageKey: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const plan = await prisma.plan.findUnique({
        where: { id: input.planId },
      });
      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
      }

      const submission = await prisma.paymentSubmission.create({
        data: {
          userId: ctx.userId,
          orgId: ctx.orgId,
          planId: input.planId,
          amount: plan.price,
          accountName: input.accountName,
          bankName: input.bankName,
          transferReference: input.transferReference,
          proofImageUrl: input.proofImageKey,
          status: "PENDING",
        },
        include: { plan: true },
      });

      return {
        success: true,
        submissionId: submission.id,
      };
    }),

  getMySubmissions: orgProcedure.query(async ({ ctx }) => {
    const submissions = await prisma.paymentSubmission.findMany({
      where: { orgId: ctx.orgId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return submissions.map((s) => ({
      id: s.id,
      planName: s.plan.name,
      amount: s.amount,
      accountName: s.accountName,
      bankName: s.bankName,
      transferReference: s.transferReference,
      proofImageUrl: s.proofImageUrl,
      status: s.status,
      adminNote: s.adminNote,
      createdAt: s.createdAt,
    }));
  }),
});
