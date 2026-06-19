import { NextResponse } from "next/server";
import { polar } from "@/lib/polar";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const { validateEvent } = await import("@polar-sh/sdk/webhooks");
    const event = validateEvent(text, headers, env.POLAR_WEBHOOK_SECRET);

    const { type } = event;

    switch (type) {
      case "order.created":
      case "order.paid": {
        const order =
          "data" in event ? (event as any).data : null;
        if (order?.customer?.externalId) {
          console.log(
            `[Polar Webhook] Order ${type} for customer ${order.customer.externalId}`,
          );
        }
        break;
      }

      case "subscription.active":
      case "subscription.created": {
        const sub =
          "data" in event ? (event as any).data : null;
        if (sub?.customer?.externalId) {
          console.log(
            `[Polar Webhook] Subscription ${type} for customer ${sub.customer.externalId}`,
          );
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.revoked": {
        const canceled =
          "data" in event ? (event as any).data : null;
        if (canceled?.customer?.externalId) {
          console.log(
            `[Polar Webhook] Subscription ${type} for customer ${canceled.customer.externalId}`,
          );
        }
        break;
      }

      case "customer.state.changed": {
        const customer =
          "data" in event ? (event as any).data : null;
        if (customer?.externalId) {
          console.log(
            `[Polar Webhook] Customer state changed for ${customer.externalId}`,
          );
        }
        break;
      }

      default:
        console.log(`[Polar Webhook] Unhandled event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "constructor" in error &&
      (error as any).constructor.name === "WebhookVerificationError"
    ) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    console.error("[Polar Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
