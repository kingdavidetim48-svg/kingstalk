import { logger } from "./logger";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limit store.
 *
 * NOTE: On serverless platforms (Netlify, Vercel), each function invocation
 * runs in an isolated container. The Map is local to a single container.
 * For distributed rate limiting, migrate to an external store (Redis, DDB).
 */
const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
const MAX_STORE_SIZE = 10_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();

  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    if (store.size >= MAX_STORE_SIZE) {
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    logger.warn({ key, count: existing.count, limit }, "Rate limit exceeded");
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}
