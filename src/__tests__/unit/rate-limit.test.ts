/**
 * UNIT TESTS: src/lib/rate-limit.ts
 *
 * Tests the local in-process fallback (Upstash env vars not set in test env).
 * Verifies: allow within limit, block over limit, window reset, separate keys.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Isolate module between tests so the store Map is fresh
describe("rateLimit (local fallback)", () => {
  beforeEach(() => {
    vi.resetModules();
    // Ensure Upstash is NOT configured in test environment
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("allows requests within the limit", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const result = await rateLimit("test:key1", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests over the limit", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    for (let i = 0; i < 3; i++) await rateLimit("test:block", 3, 60_000);
    const blocked = await rateLimit("test:block", 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("different keys are tracked independently", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    for (let i = 0; i < 3; i++) await rateLimit("test:keyA", 3, 60_000);
    const resultA = await rateLimit("test:keyA", 3, 60_000);
    const resultB = await rateLimit("test:keyB", 3, 60_000);
    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });

  it("resets after the window expires", async () => {
    vi.useFakeTimers();
    const { rateLimit } = await import("@/lib/rate-limit");
    for (let i = 0; i < 2; i++) await rateLimit("test:window", 2, 1_000);
    const blocked = await rateLimit("test:window", 2, 1_000);
    expect(blocked.allowed).toBe(false);
    // Advance past window
    vi.advanceTimersByTime(1_100);
    const reset = await rateLimit("test:window", 2, 1_000);
    expect(reset.allowed).toBe(true);
    vi.useRealTimers();
  });

  it("rateLimitOp uses correct preset limits", async () => {
    const { rateLimitOp } = await import("@/lib/rate-limit");
    // 'generation' limit is 10; first call should be allowed
    const r = await rateLimitOp("generation", "org_test");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(9); // 10 - 1
  });
});
