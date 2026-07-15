import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import {
  getSubscription,
  createSubscription,
} from "@/lib/subscription";
import { createTRPCRouter, orgProcedure } from "../init";

export const billingRouter = createTRPCRouter({
  getStatus: orgProcedure.query(async ({ ctx }: any) => {
    const subData = await getSubscription(ctx.orgId);

    if (!subData) {
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
        id: subData.plan.id,
        name: subData.plan.name,
        maxCustomVoices: subData.plan.maxCustomVoices,
        perGenerationCharacterLimit: subData.plan.perGenerationCharacterLimit,
        monthlyCharacterLimit: subData.plan.monthlyCharacterLimit,
        monthlyGenerationLimit: subData.plan.monthlyGenerationLimit,
        premiumVoices: subData.plan.premiumVoices,
        fasterGeneration: subData.plan.fasterGeneration,
        apiAccess: subData.plan.apiAccess,
        teamCollaboration: subData.plan.teamCollaboration,
      },
      currentPeriodEnd: subData.subscription.currentPeriodEnd,
      usage: {
        currentUsageCharacters: subData.subscription.currentUsageCharacters,
        currentUsageGenerations: subData.subscription.currentUsageGenerations,
        usageResetDate: subData.subscription.usageResetDate,
      },
    };
  }),

  /**
   * Select a plan during onboarding.
   * If the plan is "free", creates the subscription immediately.
   * For paid plans, returns payment instructions (redirect to checkout).
   */
  selectPlan: orgProcedure
    .input(
      z.object({
        planId: z.enum(["free", "starter", "creator", "pro"]),
      }),
    )
    .mutation(async ({ input, ctx }: any) => {
      // For free plan, create subscription immediately
      if (input.planId === "free") {
        const result = await createSubscription(ctx.orgId, "free");
        if (!result) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to activate free plan",
          });
        }
        return { activated: true, planId: "free" };
      }

      // For paid plans, return the plan details so the client can redirect to checkout
      const plan = await prisma.plan.findUnique({
        where: { id: input.planId },
      });

      if (!plan || plan.price <= 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      return {
        activated: false,
        planId: input.planId,
        requiresPayment: true,
        price: plan.price,
      };
    }),

  /**
   * List all plans (including free for the onboarding modal).
   */
  listAllPlans: orgProcedure.query(async () => {
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
      monthlyGenerationLimit: p.monthlyGenerationLimit,
      premiumVoices: p.premiumVoices,
      fasterGeneration: p.fasterGeneration,
      apiAccess: p.apiAccess,
      teamCollaboration: p.teamCollaboration,
    }));
  }),

  listPlans: orgProcedure.query(async () => {
    const plans = await prisma.plan.findMany({
      where: { id: { not: "free" } },
      orderBy: { price: "asc" },
    });
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      maxCustomVoices: p.maxCustomVoices,
      perGenerationCharacterLimit: p.perGenerationCharacterLimit,
      monthlyCharacterLimit: p.monthlyCharacterLimit,
      monthlyGenerationLimit: p.monthlyGenerationLimit,
      premiumVoices: p.premiumVoices,
      fasterGeneration: p.fasterGeneration,
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

  getMySubmissions: orgProcedure.query(async ({ ctx }: any) => {
    const submissions = await prisma.paymentSubmission.findMany({
      where: { orgId: ctx.orgId, deletedAt: null },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return submissions.map((s) => ({
      id: s.id,
      planName: s.plan.name,
      amount: s.amount,
      accountName: s.accountName,
      senderAccountNumber: s.senderAccountNumber,
      bankName: s.bankName,
      transferReference: s.transferReference,
      paymentReference: s.paymentReference,
      proofImageUrl: s.proofImageUrl,
      status: s.status,
      adminNote: s.adminNote,
      createdAt: s.createdAt,
    }));
  }),
});
