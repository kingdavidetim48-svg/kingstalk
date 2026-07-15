import type { Plan, Subscription } from "@/generated/prisma";
import {
  getSubscription as getSub,
  incrementUsage,
} from "./subscription";
export type { SubscriptionResult, LimitCheck } from "./subscription";
export {
  getSubscription,
  checkUsageReset,
  canCreateVoice,
  canGenerate,
  incrementUsage,
  hasApiAccess,
  hasTeamCollaboration,
  hasPremiumVoices,
} from "./subscription";

/**
 * @deprecated Use getSubscription() from @/lib/subscription instead.
 */
export async function getSubscriptionWithPlan(
  orgId: string,
): Promise<{ subscription: Subscription; plan: Plan } | null> {
  return getSub(orgId);
}

/**
 * @deprecated Use incrementUsage() from @/lib/subscription instead.
 */
export async function incrementCharacterUsage(
  orgId: string,
  charCount: number,
): Promise<void> {
  return incrementUsage(orgId, charCount);
}
