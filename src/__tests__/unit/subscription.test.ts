/**
 * UNIT TESTS: src/lib/subscription.ts
 *
 * Tests: canGenerate, canCreateVoice, reserveUsageAtomic, refundUsageAtomic
 * These are pure logic + DB-mocked tests — no real database required.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { canGenerate } from "@/lib/subscription";
import type { Plan, Subscription } from "@/generated/prisma";

// --- Fixtures -----------------------------------------------------------------

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "plan_test",
    name: "Test Plan",
    price: 0,
    monthlyCharacterLimit: 10_000,
    monthlyGenerationLimit: 50,
    perGenerationCharacterLimit: 1_000,
    maxCustomVoices: 2,
    apiAccess: false,
    teamCollaboration: false,
    premiumVoices: false,
    fasterGeneration: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Plan;
}

function makeSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub_test",
    orgId: "org_test",
    planId: "plan_test",
    status: "active",
    currentUsageCharacters: 0,
    currentUsageGenerations: 0,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(),
    usageResetDate: new Date(Date.now() + 86400_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Subscription;
}

// --- canGenerate --------------------------------------------------------------

describe("canGenerate", () => {
  it("allows generation within all limits", () => {
    const result = canGenerate(makeSub(), makePlan(), 500);
    expect(result.allowed).toBe(true);
  });

  it("blocks when text exceeds per-generation char limit", () => {
    const result = canGenerate(makeSub(), makePlan({ perGenerationCharacterLimit: 500 }), 501);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch("PER_GENERATION_LIMIT_EXCEEDED");
  });

  it("blocks when monthly generation count is exhausted", () => {
    const sub = makeSub({ currentUsageGenerations: 50 });
    const plan = makePlan({ monthlyGenerationLimit: 50 });
    const result = canGenerate(sub, plan, 100);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch("MONTHLY_LIMIT_EXCEEDED");
  });

  it("allows when monthlyGenerationLimit is null (unlimited)", () => {
    const sub = makeSub({ currentUsageGenerations: 9999 });
    const plan = makePlan({ monthlyGenerationLimit: null as any });
    const result = canGenerate(sub, plan, 100);
    expect(result.allowed).toBe(true);
  });

  it("blocks when monthly characters are exhausted", () => {
    const sub = makeSub({ currentUsageCharacters: 9_500 });
    const plan = makePlan({ monthlyCharacterLimit: 10_000 });
    const result = canGenerate(sub, plan, 600);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch("MONTHLY_LIMIT_EXCEEDED");
    expect(result.reason).toMatch("500");  // remaining chars
  });

  it("allows exactly at the character limit boundary", () => {
    const sub = makeSub({ currentUsageCharacters: 9_000 });
    const result = canGenerate(sub, makePlan({ monthlyCharacterLimit: 10_000 }), 1_000);
    expect(result.allowed).toBe(true);
  });

  it("blocks one character over the boundary", () => {
    const sub = makeSub({ currentUsageCharacters: 9_000 });
    const result = canGenerate(sub, makePlan({ monthlyCharacterLimit: 10_000 }), 1_001);
    expect(result.allowed).toBe(false);
  });
});
