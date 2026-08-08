/**
 * POST /api/payments/flutterwave/webhook
 *
 * Receives Flutterwave payment event notifications.
 *
 * Security checklist (ALL must pass before activating a subscription):
 *  ✓ Webhook hash header verified against FLW_WEBHOOK_SECRET_HASH
 *  ✓ Event type must be "charge.completed"
 *  ✓ Internal FlutterwavePayment record located by tx_ref
 *  ✓ Transaction re-verified via Flutterwave's /v3/transactions/:id/verify
 *  ✓ Verified amount matches expected plan amount
 *  ✓ Verified currency is USD
 *  ✓ Verified status is "successful"
 *  ✓ Payment not already processed (idempotency)
 *
 * This endpoint is the SOLE authority for activating subscriptions.
 * Visiting /app/payments/success does NOT activate a subscription.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  FLW_PLANS,
  verifyFlutterwaveTransaction,
  verifyWebhookSignature,
} from "@/lib/flutterwave";
import { createSubscription } from "@/lib/subscription";

// Disable Next.js body parsing so we can read the raw body
export const runtime = "nodejs";

interface FlwWebhookPayload {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    customer?: {
      email?: string;
      name?: string;
    };
    [key: string]: unknown;
  };
}

export async function POST(req: Request) {
  // ── 1. Verify Flutterwave webhook signature ───────────────────────────────
  const receivedHash = req.headers.get("verif-hash");

  if (!verifyWebhookSignature(receivedHash)) {
    logger.warn(
      { receivedHash: receivedHash ? "[redacted]" : null },
      "[webhook/flw] Invalid webhook signature — rejected",
    );
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 2. Parse webhook body ─────────────────────────────────────────────────
  let payload: FlwWebhookPayload;
  try {
    payload = (await req.json()) as FlwWebhookPayload;
  } catch {
    logger.warn("[webhook/flw] Could not parse webhook JSON body");
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // ── 3. Only process charge.completed events ───────────────────────────────
  if (payload.event !== "charge.completed") {
    // Acknowledge non-charge events silently (refunds, etc.)
    logger.info({ event: payload.event }, "[webhook/flw] Ignoring non-charge event");
    return NextResponse.json({ received: true });
  }

  const { id: flwTxId, tx_ref: ref, flw_ref: flwRef, amount, currency } = payload.data;

  logger.info({ ref, flwTxId, amount, currency }, "[webhook/flw] Processing charge.completed");

  // ── 4. Locate internal payment record ────────────────────────────────────
  const payment = await prisma.flutterwavePayment.findUnique({
    where: { ref },
    include: { plan: true },
  });

  if (!payment) {
    logger.error({ ref }, "[webhook/flw] No internal payment record found for ref");
    // Return 200 so Flutterwave doesn't keep retrying for orphaned refs
    return NextResponse.json({ received: true });
  }

  // ── 5. Idempotency — skip if already processed ────────────────────────────
  if (payment.status === "PAID") {
    logger.info({ ref, paymentId: payment.id }, "[webhook/flw] Already processed — skipping");
    return NextResponse.json({ received: true });
  }

  // ── 6. Re-verify transaction with Flutterwave API ────────────────────────
  // Do NOT trust the webhook payload alone. Always re-verify.
  let verified;
  try {
    verified = await verifyFlutterwaveTransaction(flwTxId);
  } catch (err) {
    logger.error({ ref, flwTxId, err }, "[webhook/flw] Transaction verification failed");
    // Return 500 so Flutterwave retries
    return NextResponse.json(
      { error: "Verification service error" },
      { status: 500 },
    );
  }

  // ── 7. Validate verified transaction details ──────────────────────────────
  const planConfig = FLW_PLANS[payment.planId];

  if (!planConfig) {
    logger.error({ planId: payment.planId, ref }, "[webhook/flw] Unknown plan in payment record");
    await markFailed(payment.id, ref, String(flwTxId), flwRef, payload.data);
    return NextResponse.json({ received: true });
  }

  const checks = {
    status: verified.status === "successful",
    currency: verified.currency === "USD",
    amount: Math.abs(verified.amount - planConfig.priceUsd) < 0.01,
    txRef: verified.tx_ref === ref,
  };

  const allPassed = Object.values(checks).every(Boolean);

  if (!allPassed) {
    logger.warn(
      { ref, checks, verified, expected: planConfig },
      "[webhook/flw] Verification checks failed — marking payment as FAILED",
    );
    await markFailed(payment.id, ref, String(flwTxId), flwRef, payload.data);
    return NextResponse.json({ received: true });
  }

  // ── 8. Activate subscription in a database transaction ───────────────────
  try {
    await prisma.$transaction(async (tx) => {
      // Mark payment as PAID
      await tx.flutterwavePayment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          flwTxId: String(flwTxId),
          flwRef,
          paidAt: new Date(),
          metadata: JSON.stringify(payload.data),
        },
      });
    });

    // Activate subscription (outside transaction so it can use createSubscription util)
    await createSubscription(payment.orgId, payment.planId);

    logger.info(
      { ref, orgId: payment.orgId, planId: payment.planId, flwTxId },
      "[webhook/flw] ✓ Subscription activated successfully",
    );
  } catch (err) {
    logger.error(
      { ref, paymentId: payment.id, err },
      "[webhook/flw] Failed to update payment or activate subscription",
    );
    // Return 500 so Flutterwave retries
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

async function markFailed(
  paymentId: string,
  ref: string,
  flwTxId: string,
  flwRef: string,
  metadata: unknown,
) {
  try {
    await prisma.flutterwavePayment.update({
      where: { id: paymentId },
      data: {
        status: "FAILED",
        flwTxId,
        flwRef,
        metadata: JSON.stringify(metadata),
      },
    });
    logger.info({ ref, paymentId }, "[webhook/flw] Payment marked as FAILED");
  } catch (err) {
    logger.error({ ref, paymentId, err }, "[webhook/flw] Failed to mark payment as FAILED");
  }
}
