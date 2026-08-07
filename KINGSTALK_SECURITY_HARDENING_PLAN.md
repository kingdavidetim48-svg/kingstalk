# KINGSTALK — PHASE 0 SECURITY HARDENING PLAN

**Architect & Lead Security Engineer:** AntiGravity AI  
**Date:** August 7, 2026  
**Status:** DRAFT / PENDING IMPLEMENTATION  

---

## Executive Summary & Objectives

The purpose of Phase 0 Security Hardening is to remediate all critical security, authorization, concurrency, billing, and storage vulnerabilities discovered during the KingsTalk Production Audit while preserving 100% of existing application functionality, database integrity, and architecture stack (Next.js, React 19, tRPC v11, Prisma, PostgreSQL, Clerk, Cloudflare R2, Modal Chatterbox TTS).

---

## Detailed Hardening Tasks & Strategy

### P0-1: Atomic Usage Reservation & Concurrency Safety
- **Finding:** TOCTOU race condition in `generations.create`. Usage is checked, expensive TTS synthesis occurs, then usage is incremented. Parallel requests can bypass monthly character and generation limits.
- **Affected Files:** `src/trpc/routers/generations.ts`, `src/lib/subscription.ts`, `prisma/schema.prisma`
- **Implementation Strategy:**
  1. Perform atomic reservation in PostgreSQL *before* calling Modal TTS microservice.
  2. Implement `reserveUsage(orgId, charCount, maxPerGen, maxMonthlyChars, maxMonthlyGens)` using Prisma transaction with atomic SQL (`UPDATE "Subscription" SET "currentUsageCharacters" = "currentUsageCharacters" + $1, "currentUsageGenerations" = "currentUsageGenerations" + 1 WHERE "orgId" = $2 AND "currentUsageCharacters" + $1 <= $3 ... RETURNING *`).
  3. If AI generation or R2 upload fails, invoke `refundUsage(orgId, charCount)` within a `catch` block to decrement `currentUsageCharacters` by `charCount` and `currentUsageGenerations` by `1`.
- **Tests Required:** Unit & concurrency integration tests proving 10 simultaneous generation requests cannot overdraw subscription limits.

### P0-2: Eliminate Python Microservice SSRF & Path Traversal
- **Finding:** `chatterbox_tts.py` uses `urllib.request.urlretrieve` when `voice_key` starts with `http://` or `https://`, exposing the Modal GPU container to SSRF and arbitrary remote file fetching.
- **Affected Files:** `chatterbox_tts.py`, `src/trpc/routers/generations.ts`
- **Implementation Strategy:**
  1. Remove `urllib.request.urlretrieve` completely from `chatterbox_tts.py`.
  2. Enforce path resolution: resolve `voice_key` strictly relative to `R2_MOUNT_PATH` (`/r2`).
  3. Validate resolved path: ensure `voice_path.is_relative_to(Path(R2_MOUNT_PATH))` or path starts with `/r2/`, and file exists.
  4. Block `..`, `http://`, `https://`, `file://`, absolute paths outside `/r2`.
- **Tests Required:** Python/API unit tests for valid R2 voice paths, `..` traversal rejection, and URL scheme rejection.

### P0-3: Prevent Cross-Organization Payment-Proof Replay
- **Finding:** Payment proof image duplicate hash check (`proofHash`) in `/api/manual-payments/submit` is scoped only to `where: { orgId }`, allowing different organizations to reuse the same payment receipt image.
- **Affected Files:** `src/app/api/manual-payments/submit/route.ts`, `prisma/schema.prisma`
- **Implementation Strategy:**
  1. Modify `proofHash` lookup in submit handler to query system-wide across all organizations (`where: { proofHash, deletedAt: null, status: { in: ["PENDING", "APPROVED"] } }`).
  2. Add `@unique` index or composite index on `proofHash` in `schema.prisma` to enforce database-level duplicate prevention.
- **Tests Required:** Integration tests attempting cross-org submission of duplicate receipt image hashes.

### P0-4: Harden Centralized Admin Authorization
- **Finding:** Admin authorization relies on comparing `email === env.ADMIN_EMAIL` scattered across routes and routers.
- **Affected Files:** `src/lib/admin.ts`, `src/trpc/routers/admin-payments.ts`, `src/trpc/routers/admin-users.ts`, `src/app/api/admin/payments/route.ts`, `src/app/api/admin/approve/route.ts`, `src/app/api/admin/reject/route.ts`, `src/app/api/push/subscribe/route.ts`, `src/app/admin/layout.tsx`
- **Implementation Strategy:**
  1. Centralize authorization in `src/lib/admin.ts` (`requireAdmin()`).
  2. Verify admin via Clerk `user.publicMetadata.role === "admin"` OR `user.email === env.ADMIN_EMAIL`.
  3. Refactor all admin API routes and tRPC admin procedures to use the single authoritative `requireAdmin()` helper.
- **Tests Required:** Role check unit tests verifying unauthenticated, normal user, and admin user scenarios.

### P0-5: Secure Audio & Download Authorization (Prevent IDOR)
- **Finding:** `/api/download` accepts arbitrary Cloudflare R2 URLs (`?url=...`), allowing download proxying of any object in the bucket. `/api/audio/[generationId]` proxies audio through server memory.
- **Affected Files:** `src/app/api/download/route.ts`, `src/app/api/audio/[generationId]/route.ts`, `src/app/api/voices/[voiceId]/route.ts`
- **Implementation Strategy:**
  1. Update `/api/download`: require `generationId` query param (e.g. `/api/download?generationId=...` or `/api/download/[generationId]`). Fetch `generation` from Prisma, check `generation.orgId === ctx.orgId`.
  2. Issue short-lived presigned R2 URL or HTTP 307 temporary redirect to Cloudflare R2 directly, eliminating server proxying and egress overhead while maintaining strict organization-level authorization.
  3. Update `/api/voices/[voiceId]`: verify system voice or custom voice matching `voice.orgId === orgId`.
- **Tests Required:** IDOR security tests verifying Org A cannot access or download Org B's generation or voice audio.

### P0-6: Sanitize Internal Error Leakage
- **Finding:** Raw microservice error details (including Python exception stack traces) are returned in tRPC error responses to clients.
- **Affected Files:** `src/trpc/routers/generations.ts`, `src/app/api/*`
- **Implementation Strategy:**
  1. Log full internal stack traces and microservice responses using `logger.error()`.
  2. Return clean, sanitized, user-friendly error messages (e.g., `"Audio generation failed. Please try again."`) in client-facing tRPC errors.
- **Tests Required:** Error response validation tests.

### P0-7: Distributed Rate Limiting & Abuse Protection
- **Finding:** In-memory `Map` rate limiting in `src/lib/rate-limit.ts` is ineffective across multiple serverless lambda instances.
- **Affected Files:** `src/lib/rate-limit.ts`
- **Implementation Strategy:**
  1. Update `rate-limit.ts` to support distributed Redis/Upstash rate limiting when `UPSTASH_REDIS_REST_URL` is provided, with graceful, non-blocking fallbacks.
  2. Configure endpoint-specific limits (e.g., generation: 10/min, voice clone: 5/min, payment submit: 5/min).
- **Tests Required:** Rate limiting unit tests.

### P0-8: Production Security Headers
- **Finding:** `next.config.ts` has zero security headers configured.
- **Affected Files:** `next.config.ts`
- **Implementation Strategy:**
  1. Configure `headers()` in `next.config.ts` with Content Security Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy (`strict-origin-when-cross-origin`), and Permissions-Policy.
  2. Ensure CSP rules allow Clerk, Cloudflare R2, Web Push, and Google Fonts scripts/styles.
- **Tests Required:** Header verification test.

### P0-9: Automated Testing Infrastructure
- **Finding:** Project has 0 tests configured.
- **Affected Files:** `package.json`, `vitest.config.ts`, `tests/*`
- **Implementation Strategy:**
  1. Set up `vitest` in `package.json`.
  2. Create test suites in `tests/`:
     - `tests/unit/subscription.test.ts` (Atomic usage reservation & limit checks)
     - `tests/unit/admin-auth.test.ts` (Admin authorization)
     - `tests/unit/tts-ssrf.test.ts` (Path traversal & SSRF rejection)
     - `tests/security/idor.test.ts` (Audio & download IDOR protection)
     - `tests/security/payment-proof.test.ts` (Global duplicate proof hash rejection)
- **Tests Required:** Full test suite execution (`npm test`).

### P0-10: Complete Verification & Report Generation
- **Strategy:** Run build (`npm run build`), lint (`npm run lint`), tests (`npm test`), and create `KINGSTALK_SECURITY_HARDENING_REPORT.md`.

---

## Migration & Data Safety Guarantee

- **Database Safety:** Schema changes will add unique constraints / indexes without dropping tables or altering existing column types.
- **Data Preservation:** Existing users, organizations, subscriptions, voices, and generations will remain fully intact.
- **Rollback Plan:** Prisma migration rollback scripts and git version control tags.
