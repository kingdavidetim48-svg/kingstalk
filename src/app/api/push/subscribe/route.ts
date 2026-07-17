import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    // Restrict subscription to authenticated admin
    await requireAdmin();

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { subscription, userAgent } = body as {
      subscription?: any;
      userAgent?: string;
    };

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription details" }, { status: 400 });
    }

    const endpoint = subscription.endpoint;
    const subscriptionStr = JSON.stringify(subscription);

    // Check if subscription already exists to prevent duplicates
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        subscription: {
          contains: endpoint,
        },
      },
    });

    if (existing) {
      // Update existing subscription metadata
      const updated = await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          subscription: subscriptionStr,
          userAgent: userAgent || null,
        },
      });
      return NextResponse.json({ success: true, id: updated.id });
    }

    const newSub = await prisma.pushSubscription.create({
      data: {
        subscription: subscriptionStr,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({ success: true, id: newSub.id });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json(
        { error: error.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 },
      );
    }
    logger.error({ error }, "Subscribe push failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
