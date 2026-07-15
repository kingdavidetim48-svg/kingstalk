import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { notifyAll } from "@/lib/notifications";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const headerPayload = await headers();
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
    }

    const payload = await request.text();
    let body: WebhookEvent;

    try {
      const secret = process.env.CLERK_WEBHOOK_SECRET;
      if (!secret) {
        logger.warn("CLERK_WEBHOOK_SECRET not set — skipping webhook verification");
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
      }
      const wh = new Webhook(secret);
      body = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const eventType = body.type;

    if (eventType === "user.created") {
      const { email_addresses, first_name, last_name, username } = body.data;
      const primaryEmail =
        email_addresses?.find((e) => e.id === body.data.primary_email_address_id)
          ?.email_address ?? email_addresses?.[0]?.email_address ?? "unknown";
      const name = [first_name, last_name].filter(Boolean).join(" ") || username || "Unknown";

      await notifyAll({
        event: "SIGN_UP",
        userName: name,
        userEmail: primaryEmail,
        timestamp: new Date(),
      });
      logger.info({ email: primaryEmail }, "Sign-up notification sent");
    } else if (eventType === "session.created") {
      const { user_id } = body.data;
      if (user_id) {
        try {
          const { clerkClient } = await import("@clerk/nextjs/server");
          const client = await clerkClient();
          const user = await client.users.getUser(user_id);
          const email =
            user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
              ?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "unknown";
          const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Unknown";

          await notifyAll({
            event: "LOGIN",
            userName: name,
            userEmail: email,
            timestamp: new Date(),
          });
          logger.info({ userId: user_id, email }, "Login notification sent");
        } catch (error) {
          logger.error({ error, userId: user_id }, "Failed to send login notification");
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Clerk webhook handler failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
