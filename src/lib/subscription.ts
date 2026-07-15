import { prisma } from "@/lib/db";
import type { Plan, Subscription } from "@/generated/prisma";

export type SubscriptionResult = {
  subscription: Subscription;
  plan: Plan;
} | null;

export type LimitCheck = {
  allowed: boolean;
  reason?: string;
};

/**
 * Fetches the active subscription + plan for an org.
 * Does NOT auto-create. Returns null if no subscription exists;
 * callers must handle this by prompting the onboarding/plan-selection flow.
 */
export async function getSubscription(
  orgId: string,
): Promise<SubscriptionResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { orgId },
    include: { plan: true },
  });

  if (!subscription) return null;

  const normalizedStatus = subscription.status.toLowerCase();
  if (normalizedStatus !== "active") return null;

  if (subscription.status !== "active") {
    await prisma.subscription
      .update({ where: { id: subscription.id }, data: { status: "active" } })
      .catch((err) => {
        console.error(
          "[subscription] Failed to normalize subscription status",
          err,
        );
      });
  }

  return { subscription, plan: subscription.plan };
}

/**
 * Creates a subscription for an org with the given plan.
 * Used during onboarding (free plan selection) or after payment approval.
 */
export async function createSubscription(
  orgId: string,
  planId: string,
): Promise<SubscriptionResult> {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return null;

  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  // Upsert so we don't error if already exists (e.g. overlapping calls)
  const subscription = await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      status: "active",
      planId: plan.id,
      currentPeriodStart: now,
      currentPeriodEnd: endDate,
      usageResetDate: endDate,
      currentUsageCharacters: 0,
      currentUsageGenerations: 0,
    },
    update: {
      status: "active",
      planId: plan.id,
      currentPeriodStart: now,
      currentPeriodEnd: endDate,
      usageResetDate: endDate,
    },
    include: { plan: true },
  });

  return { subscription, plan: subscription.plan };
}

/**
 * Resets monthly usage if the reset date has passed.
 */
export async function checkUsageReset(
  subscription: Subscription,
): Promise<Subscription> {
  if (new Date() >= subscription.usageResetDate) {
    return prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        currentUsageCharacters: 0,
        currentUsageGenerations: 0,
        usageResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  return subscription;
}

/**
 * Checks if the org can create a custom voice based on plan limits.
 */
export async function canCreateVoice(
  orgId: string,
  plan: Plan,
): Promise<LimitCheck> {
  if (plan.maxCustomVoices === null) return { allowed: true };

  const voiceCount = await prisma.voice.count({
    where: { orgId, variant: "CUSTOM" },
  });

  if (voiceCount >= plan.maxCustomVoices) {
    return {
      allowed: false,
      reason: `VOICE_LIMIT_REACHED: You've used all ${plan.maxCustomVoices} custom voice slot(s). Upgrade to add more.`,
    };
  }
  return { allowed: true };
}

/**
 * Checks if a generation is allowed within plan limits.
 */
export function canGenerate(
  subscription: Subscription,
  plan: Plan,
  charCount: number,
): LimitCheck {
  if (charCount > plan.perGenerationCharacterLimit) {
    return {
      allowed: false,
      reason: `PER_GENERATION_LIMIT_EXCEEDED: This plan allows ${plan.perGenerationCharacterLimit.toLocaleString()} chars per generation. Your text has ${charCount.toLocaleString()} chars.`,
    };
  }

  // Check monthly generation count
  if (
    plan.monthlyGenerationLimit !== null &&
    subscription.currentUsageGenerations >= plan.monthlyGenerationLimit
  ) {
    return {
      allowed: false,
      reason: `MONTHLY_LIMIT_EXCEEDED: You've used all ${plan.monthlyGenerationLimit} generation(s) this month. Upgrade for more.`,
    };
  }

  // Check monthly character total
  const newTotal = subscription.currentUsageCharacters + charCount;
  if (newTotal > plan.monthlyCharacterLimit) {
    const remaining = Math.max(
      0,
      plan.monthlyCharacterLimit - subscription.currentUsageCharacters,
    );
    return {
      allowed: false,
      reason: `MONTHLY_LIMIT_EXCEEDED: ${remaining.toLocaleString()} char(s) remaining this month.`,
    };
  }
  return { allowed: true };
}

/**
 * Increments the monthly usage counters.
 */
export async function incrementUsage(
  orgId: string,
  charCount: number,
): Promise<void> {
  await prisma.subscription.update({
    where: { orgId },
    data: {
      currentUsageCharacters: { increment: charCount },
      currentUsageGenerations: { increment: 1 },
    },
  });
}

export function hasApiAccess(plan: Plan): boolean {
  return plan.apiAccess;
}

export function hasTeamCollaboration(plan: Plan): boolean {
  return plan.teamCollaboration;
}

export function hasPremiumVoices(plan: Plan): boolean {
  return plan.premiumVoices;
}

export function hasFasterGeneration(plan: Plan): boolean {
  return plan.fasterGeneration;
}

export function getPlanName(plan: Plan): string {
  return plan.name;
}

export function getPlanPriceInNaira(plan: Plan): number {
  return plan.price / 100;
}
