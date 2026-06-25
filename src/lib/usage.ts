import { prisma } from "@/lib/db";
import type { Plan, Subscription } from "@/generated/prisma/client";

export async function getSubscriptionWithPlan(
  orgId: string,
): Promise<{ subscription: Subscription; plan: Plan } | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { orgId },
    include: { plan: true },
  });

  if (!subscription) {
    const freePlan = await prisma.plan.findUnique({
      where: { id: "free" },
    });
    if (!freePlan) return null;

    const now = new Date();
    const resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const newSubscription = await prisma.subscription.create({
      data: {
        orgId,
        status: "active",
        planId: freePlan.id,
        currentPeriodStart: now,
        currentPeriodEnd: resetAt,
        usageResetDate: resetAt,
      },
      include: { plan: true },
    });
    return { subscription: newSubscription, plan: newSubscription.plan };
  }

  if (subscription.status !== "active") return null;

  return { subscription, plan: subscription.plan };
}

export async function checkUsageReset(
  subscription: Subscription,
): Promise<Subscription> {
  if (new Date() >= subscription.usageResetDate) {
    return prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        currentUsageCharacters: 0,
        usageResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
  return subscription;
}

export async function canCreateVoice(
  orgId: string,
  plan: Plan,
): Promise<{ allowed: boolean; reason?: string }> {
  if (plan.maxCustomVoices === null) return { allowed: true };

  const voiceCount = await prisma.voice.count({
    where: { orgId, variant: "CUSTOM" },
  });

  if (voiceCount >= plan.maxCustomVoices) {
    return {
      allowed: false,
      reason: `VOICE_LIMIT_REACHED: You've used all ${plan.maxCustomVoices} custom voice slot(s). Upgrade your plan for more.`,
    };
  }
  return { allowed: true };
}

export function canGenerate(
  subscription: Subscription,
  plan: Plan,
  charCount: number,
): { allowed: boolean; reason?: string } {
  if (charCount > plan.perGenerationCharacterLimit) {
    return {
      allowed: false,
      reason: `PER_GENERATION_LIMIT_EXCEEDED: This plan allows a maximum of ${plan.perGenerationCharacterLimit.toLocaleString()} characters per generation. Your text has ${charCount.toLocaleString()} characters.`,
    };
  }

  const newTotal = subscription.currentUsageCharacters + charCount;
  if (newTotal > plan.monthlyCharacterLimit) {
    const remaining = Math.max(0, plan.monthlyCharacterLimit - subscription.currentUsageCharacters);
    return {
      allowed: false,
      reason: `MONTHLY_LIMIT_EXCEEDED: You have ${remaining.toLocaleString()} character(s) remaining this month. Upgrade your plan for more.`,
    };
  }
  return { allowed: true };
}

export async function incrementCharacterUsage(
  orgId: string,
  charCount: number,
): Promise<void> {
  await prisma.subscription.update({
    where: { orgId },
    data: { currentUsageCharacters: { increment: charCount } },
  });
}
