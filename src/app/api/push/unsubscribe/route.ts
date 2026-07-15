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

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint" },
        { status: 400 },
      );
    }

    const subscriptions = await prisma.pushSubscription.findMany();
    for (const sub of subscriptions) {
      const parsed = JSON.parse(sub.subscription) as { endpoint: string };
      if (parsed.endpoint === endpoint) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
        logger.info({ endpoint: endpoint.slice(0, 50) }, "Push subscription removed");
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: true, notFound: true });
  } catch (error) {
    logger.error({ error }, "Push unsubscribe failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
