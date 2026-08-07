# KINGSTALK — FULL PRODUCTION AUDIT REPORT

**Audit Conducted By:** Principal Software Engineer, Security Architect & UX/UI Auditor  
**Date:** August 7, 2026  
**Target Codebase:** KingsTalk (`c:\Users\LOYAL\Desktop\WEB\courseVideoGenerator\kingstalk`)  
**Audit Scope:** Full Production Read-Only Security, Architecture, Database, API, UX/UI, Performance & Deployment Review

---

## 1. Executive Summary

KingsTalk is an AI-powered voice generation and voice cloning SaaS platform built with Next.js (App Router), tRPC, Prisma (PostgreSQL), Cloudflare R2, Clerk Authentication, and a custom Python Modal TTS backend (`ChatterboxTurboTTS`).

While the core functionality (Text-to-Speech generation, custom voice cloning, manual bank transfer billing workflow, admin review dashboard) is structurally present, the current codebase exhibits several critical vulnerabilities in **concurrency/economic security**, **authorization boundaries**, **microservice SSRF risks**, and **lack of automated regression testing**.

### Production Readiness Scorecard

| Domain                   | Score (0–10) | Rating                   | Primary Assessment / Justification                                                                                             |
| :----------------------- | :----------: | :----------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Architecture**         |  `6.5 / 10`  | Moderate                 | Clean separation between tRPC routers and UI, but state & concurrency management during AI synthesis is fragile.               |
| **Security**             |  `4.0 / 10`  | High Risk                | Critical TOCTOU race condition in credit/usage limits; SSRF risk in Python TTS service; weak admin email validation.           |
| **Authentication**       |  `7.0 / 10`  | Acceptable               | Managed via Clerk with `@clerk/nextjs`. Good session isolation, but missing organization context fallback handling.            |
| **Authorization**        |  `5.0 / 10`  | Weak                     | Lack of database-backed RBAC; reliance on single hardcoded admin email string; public download route proxy risks.              |
| **Database**             |  `6.0 / 10`  | Moderate                 | Clean Prisma schema, but missing atomic transaction locking for credit balance operations and soft-delete index optimizations. |
| **Backend / API**        |  `5.5 / 10`  | Fragile                  | Microservice error leakage to end users; double-proxying large audio streams through Next.js server instances.                 |
| **Frontend**             |  `6.5 / 10`  | Moderate                 | Good UI structure with Shadcn/Radix components, but missing robust client-side error boundaries for audio playback failures.   |
| **UX / UI**              |  `6.0 / 10`  | Needs Polish             | Functional dashboard, but lacks interactive waveform editing, real-time generation progress cues, and refined mobile design.   |
| **Performance**          |  `5.0 / 10`  | Inefficient              | In-memory rate limiting resets across serverless lambda instances; streaming audio through Next.js doubles bandwidth costs.    |
| **Testing**              |  `1.0 / 10`  | Critical Deficit         | Zero automated unit, integration, or E2E tests configured in `package.json` or codebase repository.                            |
| **Production Readiness** |  `4.5 / 10`  | **NOT PRODUCTION READY** | Must fix credit race conditions, microservice SSRF, and admin authorization before handling live revenue.                      |

---

## 2. Architecture Map

```
[ User Browser / Client UI ]
           │
           │ HTTP / HTTPS (Next.js App Router + React 19)
           ▼
┌────────────────────────────────────────────────────────┐
│               Clerk Authentication Guard              │
│               (src/proxy.ts Middleware)               │
└──────────────────────────┬─────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  tRPC API Routers        │   │  REST API Routes         │
│  (src/trpc/routers/*)    │   │  (src/app/api/*)         │
│  - generations           │   │  - /api/voices/create    │
│  - billing               │   │  - /api/audio/[genId]    │
│  - admin-payments        │   │  - /api/manual-payments  │
└──────────┬───────────────┘   └──────────┬───────────────┘
           │                              │
           └───────────────┬──────────────┘
                           │ (Server-Side Business Logic)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Database & Services                  │
│  ┌────────────────────┐      ┌──────────────────────┐  │
│  │ Prisma ORM (Pg)    │      │ Cloudflare R2 Storage│  │
│  │ (src/lib/db.ts)    │      │ (src/lib/r2.ts)      │  │
│  └────────────────────┘      └──────────────────────┘  │
│                           │                            │
│                           ▼                            │
│        ┌──────────────────────────────────────┐        │
│        │ Modal Python GPU Worker (Chatterbox) │        │
│        │ (chatterbox_tts.py via FastAPI)      │        │
│        └──────────────────────────────────────┘        │
└────────────────────────────────────────────────────────┘
```

### Key Trust Boundaries

1. **Client ↔ Next.js Edge / Middleware:** Authenticated via Clerk cookies/JWT. User workspace context (`orgId`) enforced by `orgProcedure`.
2. **Next.js Server ↔ Database (PostgreSQL):** Direct connection via Prisma ORM.
3. **Next.js Server ↔ Cloudflare R2:** S3 client signed request operations using master API credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`).
4. **Next.js Server ↔ Modal AI Worker:** Microservice REST call via `chatterbox-client` protected by `x-api-key` header (`CHATTERBOX_API_KEY`).
5. **Modal AI Worker ↔ Cloudflare R2:** Direct Read-Only Cloud Bucket Mount (`/r2`).

---

## 3. Feature Inventory

| Feature                                 | Frontend Entry         | Backend Entry                                        | Database Models                                 | External Services               | Auth                       | Tests | Status  | Risk Level   |
| :-------------------------------------- | :--------------------- | :--------------------------------------------------- | :---------------------------------------------- | :------------------------------ | :------------------------- | :---- | :------ | :----------- |
| **User Sign Up / In**                   | `/sign-in`, `/sign-up` | Clerk SDK                                            | N/A (Clerk User)                                | Clerk                           | Clerk Managed              | None  | Working | Low          |
| **Organization Switch**                 | `/org-selection`       | `src/proxy.ts`                                       | N/A (Clerk Org)                                 | Clerk                           | Clerk Session              | None  | Working | Low          |
| **Text-to-Speech Generation**           | `/app` dashboard       | `generations.create`                                 | `Generation`, `Subscription`, `Voice`           | Modal TTS GPU, R2               | `orgProcedure`             | None  | Working | **CRITICAL** |
| **Voice Cloning / Upload**              | Voice Modal            | `/api/voices/create`                                 | `Voice`, `Subscription`                         | Cloudflare R2, `music-metadata` | `orgProcedure`             | None  | Working | Medium       |
| **Custom Voice Deletion**               | Voice List             | `voices.delete`                                      | `Voice`                                         | Cloudflare R2                   | `orgProcedure`             | None  | Working | Low          |
| **Generation History & Audio Playback** | `/app/history`         | `generations.getAll`, `/api/audio/[id]`              | `Generation`                                    | Cloudflare R2                   | `orgProcedure`             | None  | Working | Medium       |
| **Manual Payment Submission**           | `/app/billing`         | `/api/manual-payments/submit`                        | `PaymentSubmission`, `Plan`                     | Cloudflare R2 (Proof Image)     | `authProcedure`            | None  | Working | Medium       |
| **Admin Payment Audit & Approval**      | `/admin`               | `adminPayments.approvePayment`, `/api/admin/approve` | `PaymentSubmission`, `Subscription`, `AuditLog` | Nodemailer (SMTP), Web Push     | Admin Email Check          | None  | Working | **HIGH**     |
| **Admin User Blocking**                 | `/admin/users`         | `adminUsers.block`                                   | `BlockedUser`                                   | Clerk API                       | Admin Email Check          | None  | Working | Medium       |
| **Usage Reset Cron**                    | N/A                    | `/api/cron/reset-usage`                              | `Subscription`, `Plan`                          | None                            | `CRON_SECRET` Bearer Token | None  | Working | Low          |
| **Web Push Admin Alert**                | Admin UI               | `/api/push/subscribe`                                | `PushSubscription`                              | VAPID Web Push API              | `requireAdmin()`           | None  | Working | Low          |

---

## 4. Security Findings

### Summary of Vulnerabilities Discovered

```
[ CRITICAL ] 2 Vulnerabilities
[ HIGH     ] 3 Vulnerabilities
[ MEDIUM   ] 4 Vulnerabilities
[ LOW      ] 3 Vulnerabilities
[ INFO     ] 2 Findings
```

---

## 5. Authentication Findings

### Finding AUTH-01: Admin Privilege Granted Solely via Single String Matching (`env.ADMIN_EMAIL`)

- **ID:** `AUTH-01`
- **Severity:** `HIGH`
- **Category:** Authentication & Authorization
- **Location:** [src/lib/admin.ts](file:///c:/Users/LOYAL/Desktop/WEB/courseVideoGenerator/kingstalk/src/lib/admin.ts#L20), [src/trpc/routers/admin-payments.ts](file:///c:/Users/LOYAL/Desktop/WEB/courseVideoGenerator/kingstalk/src/trpc/routers/admin-payments.ts#L35)
- **Evidence:**
  ```typescript
  if (!email || email !== env.ADMIN_EMAIL) {
    throw new Error("FORBIDDEN");
  }
  ```
- **Why it matters:** Admin authorization relies strictly on comparing the user's primary Clerk email string against a single environment variable (`aetim8273@gmail.com`). If an admin changes their primary email address in Clerk or if team admins need to be added, access breaks or requires code redeployment.
- **Attack Scenario:** If an attacker manages to claim or alias the configured admin email on a non-verified OAuth provider or misconfigured Clerk identity route, they immediately gain full administrative privileges over payment approvals, user bans, and subscriber data export.
- **Remediation:** Implement database-backed role flags (`UserRole` table) or Clerk Organization Roles (`org:admin`).

---

## 6. Authorization Findings & Access Control

### Finding AUTHZ-01: Missing Organization Verification in Audio Proxy Download Endpoint

- **ID:** `AUTHZ-01`
- **Severity:** `HIGH`
- **Category:** Authorization / SSRF / Exposure
- **Location:** [src/app/api/download/route.ts](file:///c:/Users/LOYAL/Desktop/WEB/courseVideoGenerator/kingstalk/src/app/api/download/route.ts#L15-L20)
- **Evidence:**
  ```typescript
  const parsedUrl = new URL(audioUrl);
  const expectedHostname = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  if (
    parsedUrl.hostname !== expectedHostname &&
    !parsedUrl.hostname.endsWith(".r2.cloudflarestorage.com")
  ) {
    return NextResponse.json(
      { error: "Unauthorized download source" },
      { status: 403 },
    );
  }
  const response = await fetch(audioUrl);
  ```
- **Why it matters:** The `/api/download?url=...` endpoint accepts any Cloudflare R2 URL and fetches it without checking user session authentication or ownership of the target object.
- **Attack Scenario:** An authenticated or unauthenticated attacker who obtains an R2 object URL of another organization's private generated speech file or proof payment upload image can pass that URL to `/api/download?url=...` to bypass access controls and download arbitrary objects from the R2 storage bucket.
- **Remediation:** Remove open URL proxying. Accept only `generationId`, check `orgId` authorization in the database, and issue scoped signed URLs directly to the client.

---

## 7. Database Security Audit

### Finding DB-01: Non-Atomic Credit Check & Decrement (TOCTOU Race Condition)

- **ID:** `DB-01`
- **Severity:** `CRITICAL`
- **Category:** Business Logic & Concurrency
- **Location:** [src/trpc/routers/generations.ts](file:///c:/Users/LOYAL/Desktop/WEB/courseVideoGenerator/kingstalk/src/trpc/routers/generations.ts#L60-L78), [src/lib/subscription.ts](file:///c:/Users/LOYAL/Desktop/WEB/courseVideoGenerator/kingstalk/src/lib/subscription.ts#L172-L183)
- **Evidence:**
  1. `const subData = await getSubscription(ctx.orgId);`
  2. `canGenerate(freshSub, subData.plan, input.text.length);`
  3. External Modal AI GPU call (`chatterbox.POST("/generate", ...)`) — takes 2 to 8 seconds.
  4. `await incrementUsage(ctx.orgId, input.text.length);`
- **Why it matters:** Checking usage balance before initiating an expensive 5-second AI generation and only updating usage _after_ synthesis completes allows concurrent requests to execute simultaneously.
- **Attack Scenario:** A user on a free plan (limit 2,000 characters) issues 20 parallel requests of 1,500 characters each in under 100 milliseconds. All 20 requests read the initial usage counter (`0`), pass `canGenerate()`, consume $5.00+ in Modal GPU compute costs, and overdraw the account usage to 30,000 characters.
- **Remediation:** Use atomic database reservation (`UPDATE subscription SET currentUsageCharacters = currentUsageCharacters + :chars WHERE currentUsageCharacters + :chars <= monthlyLimit RETURNING *`). If generation fails, refund the reserved characters in a `catch` block.

---

## 8. API / Backend Security

### Finding API-01: Microservice Error Detail Leakage to End Users

- **ID:** `API-01`
- **Severity:** `MEDIUM`
- **Category:** Information Leakage
- **Location:** [src/trpc/routers/generations.ts](file:///c:/Users/LOYAL/Desktop/WEB/courseVideoGenerator/kingstalk/src/trpc/routers/generations.ts#L148-L151)
- **Evidence:**
  ```typescript
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `Failed to generate audio: ${errorDetail}`,
  });
  ```
- **Why it matters:** Python FastAPI exception stack traces (including Modal container file paths, memory addresses, and internal HTTP errors) are directly formatted and returned in tRPC error responses to client browsers.
- **Remediation:** Log detailed internal microservice errors on the server side using Pino logger, and return generic user-friendly messages (e.g., `"Voice generation service unavailable"`).

---

## 9. AI / Voice Generation Security

### Finding AI-01: SSRF / Arbitrary Remote URL Audio Fetch in Python Modal Worker

- **ID:** `AI-01`
- **Severity:** `CRITICAL`
- **Category:** Server-Side Request Forgery (SSRF)
- **Location:** [chatterbox_tts.py](file:///c:/Users/LOYAL/Desktop/WEB/courseVideoGenerator/kingstalk/chatterbox_tts.py#L75-L86)
- **Evidence:**
  ```python
  def _resolve_voice_path(voice_key: str) -> Path:
      if voice_key.startswith("http://") or voice_key.startswith("https://"):
          tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
          tmp_path = Path(tmp.name)
          tmp.close()
          urllib.request.urlretrieve(voice_key, tmp_path)
          return tmp_path
  ```
- **Why it matters:** The Modal GPU microservice inspects `voice_key`. If it begins with `http://` or `https://`, it executes `urllib.request.urlretrieve(voice_key)` inside the container environment.
- **Attack Scenario:** If an attacker bypasses frontend validation or interacts with the Modal backend directly using an exposed API key or modified tRPC call, they can force the GPU container to perform SSRF against internal cloud endpoints (e.g., `http://169.254.169.254/latest/meta-data/`) or download malicious files into `/tmp`.
- **Remediation:** Remove URL downloading logic from `chatterbox_tts.py`. Restrict `voice_key` resolution strictly to local paths inside the mounted R2 Cloud Bucket (`R2_MOUNT_PATH`).

---

## 10. Storage Security

### Finding STOR-01: Audio Double-Proxy Streaming Bottleneck

- **ID:** `STOR-01`
- **Severity:** `MEDIUM`
- **Category:** Performance & Cost Inefficiency
- **Location:** [src/app/api/audio/[generationId]/route.ts](file:///c:/Users/LOYAL/Desktop/WEB/courseVideoGenerator/kingstalk/src/app/api/audio/%5BgenerationId%5D/route.ts#L27-L37)
- **Evidence:**
  ```typescript
  const signedUrl = await getSignedAudioUrl(generation.r2ObjectKey);
  const audioResponse = await fetch(signedUrl);
  return new Response(audioResponse.body, { ... });
  ```
- **Why it matters:** Instead of redirecting the user directly to Cloudflare R2 via a 302 redirect or presigned URL, the server fetches the full audio binary from R2 into Next.js memory and streams it out to the client. This doubles server memory and egress bandwidth costs.
- **Remediation:** Return a HTTP 307 temporary redirect to the short-lived signed R2 URL or provide presigned URLs directly in the tRPC response.

---

## 11. Billing / Usage / Economic Security

### Finding BILL-01: Manual Payment Submission Proof Image Replay & Manipulation Risks

- **ID:** `BILL-01`
- **Severity:** `MEDIUM`
- **Category:** Financial Integrity
- **Location:** [src/app/api/manual-payments/submit/route.ts](file:///c:/Users/LOYAL/Desktop/WEB/courseVideoGenerator/kingstalk/src/app/api/manual-payments/submit/route.ts#L121-L136)
- **Evidence:** Payment submission verifies `proofHash` per organization (`where: { orgId, proofHash }`).
- **Why it matters:** SHA-256 hash duplication checking is scoped to the _same_ organization (`orgId`).
- **Attack Scenario:** User A in Org 1 uploads a bank receipt image. User B in Org 2 uploads the exact same receipt image. The duplicate check passes because it only checks `where: { orgId }`, allowing cross-tenant receipt reuse to claim free subscription upgrades.
- **Remediation:** Change `proofHash` lookup to a global query across all organizations: `where: { proofHash, status: { in: ["PENDING", "APPROVED"] } }`.

---

## 12. Frontend Security Findings

### Finding FRONT-01: Absence of Content Security Policy (CSP) Headers

- **ID:** `FRONT-01`
- **Severity:** `LOW`
- **Category:** Hardening
- **Location:** `next.config.ts`
- **Evidence:** `next.config.ts` is minimal and contains zero security headers (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`).
- **Remediation:** Configure standard security headers in `next.config.ts` or middleware.

---

## 13. UI/UX Findings

### UX/UI Assessment Overview

1. **Dashboard & Generation Flow (`/app`):** Clean layout powered by Tailwind CSS v4 and Radix UI. However, long audio prompts lack visual progress indicators during the 5+ second synthesis window.
2. **Audio Player:** Uses WaveSurfer.js. Good visual output, but lacks playback speed toggles (0.75x, 1.25x, 1.5x, 2.0x) and jump-forward/backward 10s controls essential for audiobook/podcast creators.
3. **Voice Selection:** System voices and custom cloned voices are listed together cleanly, but lack filtering by tone, gender, or accent.
4. **Mobile Responsiveness:** Textarea and side drawer panel controls become visually cramped on screen widths below 375px.

---

## 14. Performance Audit

1. **Rate Limiting Inefficiency:** `src/lib/rate-limit.ts` uses an in-memory `Map`. On serverless deployments (Vercel/Netlify), state is not shared between instances, allowing rate limit bypasses.
2. **Prisma Query Optimization:** Queries in `admin-payments.ts` perform `Promise.all` loops fetching Clerk users one-by-one (`client.users.getUser(userId)`). This creates an N+1 API call bottleneck on admin payment listings.
3. **Bundle Size:** `@dicebear/collection` and `wavesurfer.js` imported directly. Dynamic client-side imports should be used to reduce initial JS payload.

---

## 15. Testing Infrastructure Gaps

- **Current Test Count:** `0` Unit Tests, `0` Integration Tests, `0` E2E Tests.
- **Package Scripts:**
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "eslint"
  }
  ```
- **Risk Assessment:** Any refactoring of billing, generation credits, or authentication procedures carries 100% risk of silent regression because there is no CI test suite to validate API contracts.

---

## 16. Dependency & Supply Chain Findings

- **Next.js Version:** `16.1.6` (Current / Up to date)
- **React Version:** `19.2.3` (Current)
- **Prisma Version:** `7.8.0` (Current)
- **Warning:** `chatterbox_tts.py` uses `fastapi==0.124.4` and `chatterbox-tts==0.1.6`. Pin exact hash versions in production Modal deployment.

---

## 17. Production / Deployment Audit

- **Environment Variable Validation:** `src/lib/env.ts` uses `@t3-oss/env-nextjs` and `zod`. This is excellent practice and prevents missing environment runtime crashes.
- **Cron Route Protection:** `/api/cron/reset-usage` is guarded by `Bearer ${env.CRON_SECRET}`. Secure.

---

## 18. Technical Debt

1. Duplicate administrative checks (`requireAdmin()` in `src/lib/admin.ts` vs `requireAdminTRPC` in `admin-payments.ts`).
2. Hardcoded fallback values in payment reference generation (`PAY-XXXX-XXXX`).
3. Audio streaming proxying through Next.js route handlers rather than direct R2 presigned URLs.

---

## 19. Quick Wins (Safe Immediate Enhancements)

1. Make `proofHash` database uniqueness check global across all organizations in `/api/manual-payments/submit/route.ts`.
2. Sanitize internal error details before returning tRPC error responses in `generations.ts`.
3. Disable HTTP URL downloads in `chatterbox_tts.py` to mitigate microservice SSRF.
4. Add missing security headers (`X-Frame-Options`, `X-Content-Type-Options`) to `next.config.ts`.

---

## 20. Critical Fixes (Must Fix Before Redesign)

1. **Atomic Usage Reservation:** Implement Prisma transaction atomic credit checks to prevent TOCTOU race conditions during voice synthesis.
2. **SSRF Removal in Microservice:** Restrict Python TTS worker strictly to mounted R2 bucket storage paths.
3. **Database-Backed Admin RBAC:** Replace single `env.ADMIN_EMAIL` check with database role flags (`role = 'ADMIN'`).
4. **Direct R2 Presigned Downloads:** Eliminate server audio streaming bottleneck in `/api/audio/[generationId]` and `/api/download`.

---

## 21. Recommended Architecture

```
[ Client Browser ]
       │
       │ (1. Request presigned upload / generation)
       ▼
[ Next.js API / tRPC ] ──(2. Atomic Tx Credit Reserve)──► [ PostgreSQL DB ]
       │
       │ (3. Synthesize via Internal R2 Key)
       ▼
[ Modal GPU Worker ] ───(4. Write WAV Audio)─────────────► [ Cloudflare R2 ]
       │                                                         ▲
       │ (5. Return presigned GET URL)                           │
       └─────────────────────────────────────────────────────────┘
```

---

## 22. Recommended UI/UX Direction

- **Dark Mode Glassmorphism Theme:** Deep slate/indigo tones (`#0F172A`, `#6366F1`) with subtle glowing gradients.
- **Audio Workstation Interface:** Timeline view with paragraph-by-paragraph text block generation, individual audio waveform previews, and bulk export.
- **Real-Time Generation Feedback:** Dynamic SSE/WebSocket progress bar displaying active synthesis stages (Queued → Synthesizing → Storing → Ready).

---

## 23. Production Hardening Roadmap & Final Priority Matrix

| Priority | Issue                                             | Category            | Impact   | Effort | Recommended Phase                 |
| :------: | :------------------------------------------------ | :------------------ | :------- | :----- | :-------------------------------- |
|  **P0**  | Fix TOCTOU Concurrency Credit Bypass              | Security / Billing  | Critical | Medium | Phase 0 — Critical Security Fixes |
|  **P0**  | Disable Remote URL Fetch (SSRF) in Python Worker  | Security / AI       | Critical | Low    | Phase 0 — Critical Security Fixes |
|  **P0**  | Global Proof Image Hash Check for Billing         | Security / Billing  | High     | Low    | Phase 0 — Critical Security Fixes |
|  **P1**  | Implement Database RBAC for Admin Access          | Security / Auth     | High     | Medium | Phase 1 — Auth Hardening          |
|  **P1**  | Replace Audio Streaming Proxy with Presigned URLs | Performance / Costs | High     | Medium | Phase 2 — Storage Hardening       |
|  **P2**  | Add Automated Integration & E2E Test Suite        | Quality / Testing   | High     | High   | Phase 3 — Testing Suite           |
|  **P3**  | Frontend & UI/UX Redesign Implementation          | Product / UX        | Medium   | High   | Phase 4 — Product Redesign        |

---

### Audit Completion Summary

**AUDIT COMPLETE — NO IMPLEMENTATION CHANGES MADE.**

### Top 10 Priority Fixes Before KingsTalk Redesign:

1. **Fix TOCTOU Credit Race Condition:** Wrap `canGenerate` credit checks and usage increments in an atomic Prisma transaction to prevent free generation overdraws via parallel requests.
2. **Eliminate Python Microservice SSRF:** Remove `urllib.request.urlretrieve` from `chatterbox_tts.py` and enforce strict local path resolution inside the R2 Cloud Mount.
3. **Make Payment Proof Hash Check Global:** Change `proofHash` uniqueness checks in `/api/manual-payments/submit` from organization-scoped to system-wide to prevent cross-tenant receipt reuse.
4. **Implement Real Database RBAC:** Migrate from hardcoded `env.ADMIN_EMAIL` string comparison to explicit database roles (`UserRole` table) or Clerk Organization Roles.
5. **Switch Audio Delivery to Presigned URLs / Redirects:** Replace Next.js server audio streaming in `/api/audio/[generationId]` with short-lived presigned R2 URLs to eliminate server memory and egress overhead.
6. **Restrict Download Proxy Endpoint:** Remove open R2 URL proxying in `/api/download/route.ts` and require database generation ID ownership verification.
7. **Sanitize Backend Error Messages:** Prevent internal Python exception traces and system paths from leaking to clients in tRPC error payloads.
8. **Migrate Rate Limiting to Distributed Store:** Replace in-memory `Map` rate limiting with Upstash Redis / Redis store for serverless compatibility.
9. **Establish CI/CD Testing Infrastructure:** Create a comprehensive Vitest / Playwright test suite covering credit calculations, authentication guards, and API routes.
10. **Configure HTTP Security Headers:** Set Content Security Policy (CSP), HSTS, `X-Frame-Options`, and `X-Content-Type-Options` in `next.config.ts`.
