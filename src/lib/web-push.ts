import "server-only";
import webpush from "web-push";
import { env } from "./env";
import { prisma } from "./db";
import { logger } from "./logger";

if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

export async function sendPushNotification(
  payload: PushPayload,
): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    logger.warn("VAPID keys not configured — skipping push notification");
    return;
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    if (subscriptions.length === 0) {
      logger.debug("No push subscriptions to notify");
      return;
    }

    const data = JSON.stringify({
      ...payload,
      url: payload.url ?? "/admin",
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) => {
        const subscription = JSON.parse(sub.subscription) as any;
        return webpush.sendNotification(subscription, data, {
          TTL: 86400,
        });
      }),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      logger.warn({ failed, total: subscriptions.length }, "Push notifications had failures");

      const failedSubs: string[] = [];
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          const err = r.reason as Error;
          if (err.message?.includes("410") || err.message?.includes("404")) {
            failedSubs.push(subscriptions[i].id);
          }
        }
      });

      if (failedSubs.length > 0) {
        await prisma.pushSubscription.deleteMany({
          where: { id: { in: failedSubs } },
        });
        logger.info({ count: failedSubs.length }, "Stale push subscriptions removed");
      }
    }
  } catch (error) {
    logger.error({ error }, "Failed to send push notifications");
  }
}

export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  const vapidKeys = webpush.generateVAPIDKeys();
  return {
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey,
  };
}
