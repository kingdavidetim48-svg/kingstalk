import { NextResponse } from "next/server";
import { validateEvent } from "@polar-sh/sdk/webhooks";

import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Polar webhook route is working",
  });
}

export async function POST(request: Request) {
  try {
    const payload = await request.text();

    const headers: Record<string, string> = {};

    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const event = await validateEvent(
      payload,
      headers,
      env.POLAR_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case "order.created":
      case "order.paid": {
        const order = event.data;

        console.log(
          `[Polar Webhook] ${event.type} for customer ${order.customer?.externalId ?? "unknown"}`,
        );

        break;
      }

      case "subscription.created":
      case "subscription.active": {
        const subscription = event.data;

        console.log(
          `[Polar Webhook] ${event.type} for customer ${subscription.customer?.externalId ?? "unknown"}`,
        );

        break;
      }

      case "subscription.canceled":
      case "subscription.revoked": {
        const subscription = event.data;

        console.log(
          `[Polar Webhook] ${event.type} for customer ${subscription.customer?.externalId ?? "unknown"}`,
        );

        break;
      }

      case "customer.state_changed": {
        const customer = event.data;

        console.log(
          `[Polar Webhook] Customer state changed for ${customer.externalId ?? "unknown"}`,
        );

        break;
      }

      default: {
        console.log(`[Polar Webhook] Unhandled event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Polar Webhook] Error:", error);

    if (error instanceof Error && error.name === "WebhookVerificationError") {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
