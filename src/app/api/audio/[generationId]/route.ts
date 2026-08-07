import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { getSignedAudioUrl } from "@/lib/r2";
import { logger } from "@/lib/logger";

/**
 * P0-5: Audio playback endpoint.
 *
 * Verifies org ownership of the generation then issues a 302 redirect
 * to a short-lived signed R2 URL. The browser streams directly from R2
 * — no server-side audio proxying.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ generationId: string }> },
) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { generationId } = await params;

    const generation = await prisma.generation.findUnique({
      where: { id: generationId, orgId },
      select: { r2ObjectKey: true },
    });

    if (!generation) {
      return new Response("Not found", { status: 404 });
    }

    if (!generation.r2ObjectKey) {
      return new Response("Audio is not available yet", { status: 409 });
    }

    const signedUrl = await getSignedAudioUrl(generation.r2ObjectKey);

    // Redirect to signed R2 URL — browser handles streaming
    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        // Prevent caching of the signed URL itself
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error), generationId: (await params).generationId },
      "Failed to generate audio URL",
    );
    return new Response("Internal server error", { status: 500 });
  }
}

