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

      const callback_url = `${env.APP_URL}/app/welcome?plan=${input.planId}`;

      const result = await paystack.transaction.initialize({
        email,
        amount: plan.price * 100,
        plan: plan.paystackPlanCode,
        callback_url,
        metadata: { orgId: ctx.orgId },
      });

      return {
        authorizationUrl: result.data.authorization_url,
        reference: result.data.reference,
      };
    }),

  verifyPaystack: orgProcedure
    .input(z.object({ reference: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await paystack.transaction.verify(input.reference);

      if (result.data.status !== "success") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment not successful",
        });
      }

      const existingPayment = await prisma.payment.findUnique({
        where: { reference: input.reference },
      });

      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            orgId: ctx.orgId,
            reference: input.reference,
            amount: result.data.amount,
            currency: result.data.currency,
            status: "success",
            paidAt: result.data.paid_at ? new Date(result.data.paid_at) : null,
          },
        });
      }

      const planCode = result.data.plan?.plan_code;
      let plan = null;

      if (planCode) {
        plan = await prisma.plan.findUnique({
          where: { paystackPlanCode: planCode },
        });

        if (plan) {
          const customerCode = result.data.customer?.customer_code ?? "";
          const now = new Date();
          const resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await prisma.subscription.upsert({
            where: { orgId: ctx.orgId },
            create: {
              orgId: ctx.orgId,
              paystackCustomerCode: customerCode,
              paystackSubscriptionCode: result.data.reference,
              status: "active",
              planId: plan.id,
              currentPeriodStart: now,
              currentPeriodEnd: resetAt,
              usageResetDate: resetAt,
            },
            update: {
              status: "active",
              planId: plan.id,
              paystackCustomerCode: customerCode,
              currentPeriodStart: now,
              currentPeriodEnd: resetAt,
              usageResetDate: resetAt,
              currentUsageCharacters: 0,
            },
          });
        }
      }

      return {
        success: true,
        plan: plan
          ? {
              id: plan.id,
              name: plan.name,
              maxCustomVoices: plan.maxCustomVoices,
              perGenerationCharacterLimit: plan.perGenerationCharacterLimit,
              monthlyCharacterLimit: plan.monthlyCharacterLimit,
              premiumVoices: plan.premiumVoices,
              apiAccess: plan.apiAccess,
              teamCollaboration: plan.teamCollaboration,
            }
          : null,
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
});
