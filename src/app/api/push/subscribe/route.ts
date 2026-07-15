import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription, userAgent } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 },
      );
    }

    const existing = await prisma.pushSubscription.findFirst({
      where: { subscription: JSON.stringify(subscription) },
    });

    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { userAgent, updatedAt: new Date() },
      });
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    await prisma.pushSubscription.create({
      data: {
        subscription: JSON.stringify(subscription),
        userAgent: userAgent ?? null,
      },
    });

    logger.info({ userAgent }, "New push subscription registered");
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Push subscribe failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
