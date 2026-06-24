import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// This endpoint should be called by a cron job (e.g., daily)
// It will reset usage for subscriptions whose reset date has passed
export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // Find all subscriptions that need reset
    const subscriptionsToReset = await prisma.subscription.findMany({
      where: {
        status: "active",
        usageResetDate: {
          lte: now,
        },
      },
      include: {
        plan: true,
      },
    });

    let resetCount = 0;
    
    for (const subscription of subscriptionsToReset) {
      // Calculate next reset date (30 days from now)
      const nextResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          currentUsageCharacters: 0,
          usageResetDate: nextResetDate,
          currentPeriodStart: now,
          currentPeriodEnd: nextResetDate,
        },
      });
      
      resetCount++;
    }

    return NextResponse.json({
      success: true,
      resetCount,
      message: `Reset ${resetCount} subscription(s)`,
    });
  } catch (error) {
    console.error("[Usage Reset] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
