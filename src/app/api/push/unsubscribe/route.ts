import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    // Restrict unsubscribe to authenticated admin
    await requireAdmin();

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { endpoint } = body as { endpoint?: string };

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    // Find subscription containing this endpoint and delete it
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        subscription: {
          contains: endpoint,
        },
      },
    });

    if (existing) {
      await prisma.pushSubscription.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, message: "Subscription removed" });
    }

    return NextResponse.json({ success: true, message: "No matching subscription found" });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json(
        { error: error.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 },
      );
    }
    logger.error({ error }, "Unsubscribe push failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
