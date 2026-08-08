/**
 * POST /api/payments/create
 *
 * Creates a pending Flutterwave payment record and returns a redirect URL.
 *
 * Security:
 * - Requires authenticated Clerk session.
 * - Requires active org context.
 * - Amount and currency resolved entirely server-side from DB.
 * - Client sends ONLY the plan identifier.
 * - A pending FlutterwavePayment record is created BEFORE redirecting,
 *   so the webhook can locate it by the internal ref.
 */
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  FLW_PLANS,
  generatePaymentRef,
  initFlutterwavePayment,
} from "@/lib/flutterwave";

const bodySchema = z.object({
  plan: z.enum(["starter", "creator", "pro"]),
});

export async function POST(req: Request) {
  // ── 1. Authentication ────────────────────────────────────────────────────
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json(
      { error: "No organization context. Please select or create an organization." },
      { status: 403 },
    );
  }

  // ── 2. Parse and validate request body ───────────────────────────────────
  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    body = bodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected { plan: 'starter' | 'creator' | 'pro' }" },
      { status: 400 },
    );
  }

  // ── 3. Resolve plan from SERVER config — never trust client ───────────────
  const planConfig = FLW_PLANS[body.plan];
  if (!planConfig) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  // Verify the plan actually exists in the database
  const dbPlan = await prisma.plan.findUnique({ where: { id: body.plan } });
  if (!dbPlan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // ── 4. Fetch user details for Flutterwave customer object ────────────────
  let customerEmail = "user@kingstalk.ai";
  let customerName = "KingsTalk User";
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    customerEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      customerEmail;
    customerName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      customerName;
  } catch (err) {
    logger.warn({ userId, err }, "[payments/create] Could not fetch user from Clerk");
  }

  // ── 5. Generate a unique internal payment reference ───────────────────────
  const ref = generatePaymentRef(body.plan);

  // ── 6. Persist a PENDING payment record BEFORE the redirect ───────────────
  // This ensures the webhook can always locate the payment by ref,
  // even if it fires before the user returns to the success page.
  try {
    await prisma.flutterwavePayment.create({
      data: {
        userId,
        orgId,
        planId: body.plan,
        amount: planConfig.priceUsd,
        currency: planConfig.currency,
        ref,
        status: "PENDING",
        provider: "flutterwave",
      },
    });
  } catch (err) {
    logger.error({ userId, orgId, plan: body.plan, err }, "[payments/create] Failed to create pending payment record");
    return NextResponse.json(
      { error: "Failed to initialize payment. Please try again." },
      { status: 500 },
    );
  }

  // ── 7. Create Flutterwave payment link ────────────────────────────────────
  const redirectUrl = `${env.APP_URL}/app/payments/success?ref=${ref}`;

  try {
    const { paymentLink } = await initFlutterwavePayment({
      amount: planConfig.priceUsd,
      currency: planConfig.currency,
      ref,
      redirectUrl,
      customerEmail,
      customerName,
      planName: dbPlan.name,
      meta: {
        orgId,
        userId,
        planId: body.plan,
        internalRef: ref,
      },
    });

    logger.info(
      { userId, orgId, plan: body.plan, ref },
      "[payments/create] Payment link created",
    );

    return NextResponse.json({ paymentLink, ref });
  } catch (err) {
    // Clean up the pending record if the link creation fails
    await prisma.flutterwavePayment
      .delete({ where: { ref } })
      .catch(() => {/* ignore cleanup failure */});

    logger.error({ userId, orgId, plan: body.plan, ref, err }, "[payments/create] Flutterwave link creation failed");
    return NextResponse.json(
      { error: "Failed to start payment. Please try again." },
      { status: 502 },
    );
  }
}
