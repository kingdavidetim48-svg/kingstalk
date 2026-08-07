/**
 * P0-7: Distributed Rate Limiter
 *
 * Two-tier implementation:
 *   TIER 1 (preferred): Upstash Redis via HTTP REST API — works across serverless instances.
 *                       Activated when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
 *   TIER 2 (fallback):  In-process Map — works for single-instance/dev deployments only.
 *                       NOT suitable for multi-instance production without Redis.
 *
 * Infrastructure requirement for full distribution:
 *   UPSTASH_REDIS_REST_URL=https://<your-db>.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=<your-token>
 *
 * Operation-specific limits (use rateLimitOp for named presets):
 *   generation   — 10 req / 60 s per org
 *   voice-clone  — 5  req / 60 s per org
 *   payment      — 5  req / 60 s per user+org
 *   trpc-global  — 120 req / 60 s per IP
 *   admin        — 30  req / 60 s per user
 */

import { logger } from "./logger";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ─── Operation presets ────────────────────────────────────────────────────────

export type RateLimitOperation =
  | "generation"
  | "voice-clone"
  | "payment"
  | "trpc-global"
  | "admin";

const OPERATION_LIMITS: Record<RateLimitOperation, { limit: number; windowMs: number }> = {
  generation: { limit: 10, windowMs: 60_000 },
  "voice-clone": { limit: 5, windowMs: 60_000 },
  payment: { limit: 5, windowMs: 60_000 },
  "trpc-global": { limit: 120, windowMs: 60_000 },
  admin: { limit: 30, windowMs: 60_000 },
};

export function rateLimitOp(
  operation: RateLimitOperation,
  identifier: string,
): Promise<RateLimitResult> {
  const { limit, windowMs } = OPERATION_LIMITS[operation];
  return rateLimit(`${operation}:${identifier}`, limit, windowMs);
}

// ─── Upstash HTTP backend ─────────────────────────────────────────────────────

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = Boolean(upstashUrl && upstashToken);

if (!useUpstash) {
  logger.warn(
    "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set. " +
      "Rate limiting is using an in-process Map. " +
      "This is NOT suitable for multi-instance production deployments.",
  );
}

async function upstashRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `rl:${key}`;

  // INCR + EXPIRE via pipeline — two commands, one HTTP round-trip
  const pipeline = [
    ["INCR", redisKey],
    ["PEXPIRE", redisKey, windowMs, "NX"],
    ["PTTL", redisKey],
  ];

  const resp = await fetch(`${upstashUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pipeline),
    // Abort if Redis is slow — fall through to local limiter
    signal: AbortSignal.timeout(1500),
  });

  if (!resp.ok) {
    throw new Error(`Upstash HTTP error: ${resp.status}`);
  }

  const results = (await resp.json()) as Array<{ result: number | string | null }>;
  const count = (results[0]?.result as number) ?? 1;
  const pttl = (results[2]?.result as number) ?? windowMs;
  const resetAt = Date.now() + Math.max(pttl, 0);
  const remaining = Math.max(0, limit - count);
  const allowed = count <= limit;

  if (!allowed) {
    logger.warn({ key, count, limit, windowSec }, "Rate limit exceeded (Upstash)");
  }

  return { allowed, remaining, resetAt };
}

// ─── In-process fallback ──────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60_000;
const MAX_STORE_SIZE = 10_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

function localRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanup();
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    if (store.size >= MAX_STORE_SIZE) {
      // Store full — fail open to avoid DoS on legitimate users
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    logger.warn({ key, count: existing.count, limit }, "Rate limit exceeded (local)");
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Apply rate limiting for the given key.
 *
 * Uses Upstash Redis when configured, falls back to in-process Map.
 * If Upstash is unreachable (network error / timeout), fails OPEN and logs a warning
 * so that a Redis outage does not cause a site outage.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (useUpstash) {
    try {
      return await upstashRateLimit(key, limit, windowMs);
    } catch (err) {
      logger.error(
        { key, error: err instanceof Error ? err.message : String(err) },
        "Upstash rate-limit request failed — falling back to local limiter",
      );
      // Graceful degradation: local limiter as safety net
    }
  }
  return localRateLimit(key, limit, windowMs);
}

