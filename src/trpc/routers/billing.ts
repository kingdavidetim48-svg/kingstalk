import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { paystack } from "@/lib/paystack";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { createTRPCRouter, orgProcedure } from "../init";

export const billingRouter = createTRPCRouter({
  initializePaystack: orgProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const plan = await prisma.plan.findUnique({
        where: { id: input.planId },
      });
      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      const client = await clerkClient();
      const clerkUser = await client.users.getUser(ctx.userId);
      const email =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User email not found",
        });
      }

      const result = await paystack.transaction.initialize({
        email,
        amount: plan.price * 100,
        plan: plan.paystackPlanCode,
        callback_url: `${env.APP_URL}?paystack_status=success`,
        metadata: { orgId: ctx.orgId },
      });

      return {
        authorizationUrl: result.data.authorization_url,
        reference: result.data.reference,
      };
    }),

  createPortalSession: orgProcedure.mutation(async () => {
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message:
        "Manage your subscription in the Paystack Dashboard. Contact support for the link.",
    });
  }),

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
      };
    }

    return {
      hasActiveSubscription: true,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        maxCustomVoices: subscription.plan.maxCustomVoices,
        maxGenerationLength: subscription.plan.maxGenerationLength,
        premiumVoices: subscription.plan.premiumVoices,
      },
      currentPeriodEnd: subscription.currentPeriodEnd,
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
      maxGenerationLength: p.maxGenerationLength,
      premiumVoices: p.premiumVoices,
    }));
  }),
});
