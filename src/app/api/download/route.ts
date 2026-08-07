import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getSignedUrlForKey } from "@/lib/r2";
import { logger } from "@/lib/logger";

/**
 * P0-5: Secure audio download endpoint.
 *
 * Accepts ?generationId=... and verifies:
 *   1. User is authenticated
 *   2. User has an active org
 *   3. Generation belongs to that org
 *   4. Generation has a stored R2 object key
 *
 * Returns a short-lived signed R2 URL via HTTP 307 redirect.
 * Never accepts arbitrary external URLs.
 *
 * Legacy ?url= parameter is rejected with 400.
 */
export async function GET(request: Request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Explicitly reject legacy open-URL proxy usage
    if (searchParams.has("url")) {
      return NextResponse.json(
        { error: "Direct URL downloads are not supported. Use generationId." },
        { status: 400 },
      );
    }

    const generationId = searchParams.get("generationId");
    const filename = searchParams.get("filename") || "kingstalk-speech.wav";

    if (!generationId) {
      return NextResponse.json(
        { error: "generationId is required" },
        { status: 400 },
      );
    }

    // P0-5: Verify ownership — generation must belong to this org
    const generation = await prisma.generation.findUnique({
      where: { id: generationId, orgId },
      select: { r2ObjectKey: true },
    });

    if (!generation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!generation.r2ObjectKey) {
      return NextResponse.json(
        { error: "Audio is not yet available" },
        { status: 409 },
      );
    }

    // Issue short-lived signed download URL (5 minutes)
    const signedUrl = await getSignedUrlForKey(generation.r2ObjectKey, 300);

    // Return the signed URL so the client can download directly from R2
    // This eliminates server-side audio streaming overhead
    return NextResponse.json({ url: signedUrl, filename });
  } catch (error) {
    logger.error({ error }, "Audio download failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

