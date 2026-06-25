import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { getSignedUrlForKey } from "@/lib/r2";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const where = statusFilter && ["PENDING", "APPROVED", "REJECTED"].includes(statusFilter)
      ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" }
      : {};

    const submissions = await prisma.paymentSubmission.findMany({
      where,
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    const withImageUrls = await Promise.all(
      submissions.map(async (s) => {
        let imageUrl: string | null = s.proofImageUrl;
        if (imageUrl && !imageUrl.startsWith("http")) {
          try {
            imageUrl = await getSignedUrlForKey(imageUrl, 86400);
          } catch {
            imageUrl = null;
          }
        }
        return { ...s, imageUrl };
      }),
    );

    return NextResponse.json(withImageUrls);
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json(
        { error: error.message === "UNAUTHORIZED" ? "Unauthorized" : "Forbidden" },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 },
      );
    }
    console.error("[Admin Payments] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
