/**
 * Flutterwave payment utility library — server-side only.
 *
 * Uses the official Flutterwave Standard (Inline) payment flow:
 *   POST /v3/payments → get payment_link → redirect user → webhook confirms payment
 *
 * Security rules enforced here:
 *  - Secret key NEVER sent to the client.
 *  - Webhook signature verified via verifyWebhookSignature() before processing.
 *  - Amount/currency resolved server-side from DB plan; never trusted from client.
 *  - Idempotency: webhook handler checks existing status before updating.
 */
import "server-only";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

// ────────────────────────────────────────────────────────────────────────────
// Plan configuration — SOURCE OF TRUTH for pricing and allowances.
// Never trust these values from the client.
// ────────────────────────────────────────────────────────────────────────────

export const FLW_PLANS: Record<
  string,
  { priceUsd: number; currency: "USD" }
> = {
  starter: { priceUsd: 10, currency: "USD" },
  creator: { priceUsd: 25, currency: "USD" },
  pro: { priceUsd: 50, currency: "USD" },
};

// ────────────────────────────────────────────────────────────────────────────
// Reference generation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generates a unique internal payment reference.
 * Format: KST-{PLAN}-{TIMESTAMP_BASE36}-{RANDOM_4}
 * Example: KST-STARTER-M5LZQR4-8F2A
 */
export function generatePaymentRef(planId: string): string {
  const planSlug = planId.toUpperCase().slice(0, 10);
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KST-${planSlug}-${ts}-${rnd}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Flutterwave API types
// ────────────────────────────────────────────────────────────────────────────

interface FlwInitPaymentInput {
  amount: number;
  currency: string;
  ref: string;
  redirectUrl: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  planName: string;
  meta?: Record<string, string>;
}

interface FlwInitPaymentResult {
  paymentLink: string;
}

interface FlwVerifyResult {
  status: "successful" | "failed" | "pending" | "cancelled";
  amount: number;
  currency: string;
  tx_ref: string;
  id: number;
  flw_ref: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Initialize payment (create payment link)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Calls Flutterwave's /v3/payments endpoint to create a hosted payment page.
 * Returns the URL to redirect the user to.
 */
export async function initFlutterwavePayment(
  input: FlwInitPaymentInput,
): Promise<FlwInitPaymentResult> {
  const payload = {
    tx_ref: input.ref,
    amount: input.amount,
    currency: input.currency,
    redirect_url: input.redirectUrl,
    customer: {
      email: input.customerEmail,
      name: input.customerName,
      phonenumber: input.customerPhone ?? "",
    },
    customizations: {
      title: "KingsTalk",
      description: `${input.planName} Plan — Monthly Subscription`,
      logo: "", // optional: add your CDN logo URL
    },
    meta: input.meta ?? {},
    payment_options: "card,ussd",
  };

  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.FLW_SECRET_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    logger.error(
      { status: res.status, body: text },
      "[flutterwave] Failed to create payment link",
    );
    throw new Error(`Flutterwave init failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    status: string;
    message: string;
    data: { link: string };
  };

  if (json.status !== "success" || !json.data?.link) {
    logger.error({ json }, "[flutterwave] Unexpected response from /v3/payments");
    throw new Error("Flutterwave did not return a payment link");
  }

  return { paymentLink: json.data.link };
}

// ────────────────────────────────────────────────────────────────────────────
// Verify transaction (called from webhook + optionally from status page)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Verifies a Flutterwave transaction by ID using the server-side secret key.
 * This is the authoritative check — never trust client-supplied amounts.
 */
export async function verifyFlutterwaveTransaction(
  transactionId: string | number,
): Promise<FlwVerifyResult> {
  const res = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.FLW_SECRET_KEY}`,
      },
      // Prevent caching — we need fresh status every time
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    logger.error(
      { transactionId, status: res.status, body: text },
      "[flutterwave] Transaction verification HTTP error",
    );
    throw new Error(`Flutterwave verify failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    status: string;
    data: FlwVerifyResult;
  };

  if (json.status !== "success" || !json.data) {
    logger.error(
      { transactionId, json },
      "[flutterwave] Unexpected verify response",
    );
    throw new Error("Flutterwave verification returned unexpected structure");
  }

  return json.data;
}

// ────────────────────────────────────────────────────────────────────────────
// Webhook signature verification
// ────────────────────────────────────────────────────────────────────────────

/**
 * Verifies the Flutterwave webhook hash header.
 * Flutterwave sends the secret hash as a plain header (not HMAC).
 * See: https://developer.flutterwave.com/docs/integration-guides/webhooks
 */
export function verifyWebhookSignature(
  receivedHash: string | null,
): boolean {
  if (!receivedHash) return false;
  // Constant-time comparison to prevent timing attacks
  const expected = env.FLW_WEBHOOK_SECRET_HASH;
  if (receivedHash.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= receivedHash.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
