import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature") ?? "";

    if (!signature || !verifySignature(body, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case "charge.success": {
        const data = event.data;
        const reference = data.reference;
        const metadata = data.metadata ?? {};
        const orgId: string | undefined = metadata.orgId;
        const planCode = data.plan?.plan_code;

        const existingPayment = await prisma.payment.findUnique({
          where: { reference },
        });
        if (existingPayment) {
          return NextResponse.json({ received: true });
        }

        await prisma.payment.create({
          data: {
            orgId: orgId ?? "unknown",
            reference,
            amount: data.amount,
            currency: data.currency ?? "NGN",
            status: data.status,
            paidAt: data.paid_at ? new Date(data.paid_at) : null,
          },
        });

        if (orgId && planCode && data.status === "success") {
          const plan = await prisma.plan.findUnique({
            where: { paystackPlanCode: planCode },
          });

          if (plan) {
            const customerCode = data.customer?.customer_code ?? "";
            const subscriptionCode = data.subscription?.subscription_code ?? "";

            await prisma.subscription.upsert({
              where: { orgId },
              create: {
                orgId,
                paystackCustomerCode: customerCode,
                paystackSubscriptionCode: subscriptionCode,
                status: "active",
                planId: plan.id,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000,
                ),
              },
              update: {
                status: "active",
                planId: plan.id,
                paystackCustomerCode: customerCode,
                paystackSubscriptionCode: subscriptionCode,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000,
                ),
              },
            });
          }
        }

        break;
      }

      case "subscription.create": {
        const data = event.data;
        const subscriptionCode = data.subscription_code;
        const planCode = data.plan?.plan_code;
        const customerCode = data.customer?.customer_code;
        const status = data.status;

        if (!subscriptionCode || !planCode) break;

        const plan = await prisma.plan.findUnique({
          where: { paystackPlanCode: planCode },
        });
        if (!plan) break;

        const metadata = data.customer?.metadata ?? {};
        const orgId: string | undefined = metadata.orgId;

        if (orgId) {
          await prisma.subscription.upsert({
            where: { orgId },
            create: {
              orgId,
              paystackCustomerCode: customerCode ?? "",
              paystackSubscriptionCode: subscriptionCode,
              status: status === "active" ? "active" : "incomplete",
              planId: plan.id,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
              ),
            },
            update: {
              status: status === "active" ? "active" : "incomplete",
              planId: plan.id,
              paystackCustomerCode: customerCode ?? "",
            },
          });
        }

        break;
      }

      case "subscription.disable": {
        const data = event.data;
        const subscriptionCode = data.subscription_code;

        if (!subscriptionCode) break;

        await prisma.subscription.updateMany({
          where: { paystackSubscriptionCode: subscriptionCode },
          data: { status: "canceled" },
        });

        break;
      }

      case "invoice.updated": {
        const data = event.data;
        const subscriptionCode = data.subscription?.subscription_code;

        if (!subscriptionCode) break;

        const nextPeriodStart = data.next_payment_date
          ? new Date(data.next_payment_date)
          : null;
        const nextPeriodEnd = data.period_end
          ? new Date(data.period_end)
          : null;

        if (nextPeriodStart && nextPeriodEnd) {
          await prisma.subscription.updateMany({
            where: { paystackSubscriptionCode: subscriptionCode },
            data: {
              currentPeriodStart: nextPeriodStart,
              currentPeriodEnd: nextPeriodEnd,
              status: "active",
            },
          });
        }

        break;
      }

      default: {
        console.log(`[Paystack Webhook] Unhandled event: ${event.event}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Paystack Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
