import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || "speech.wav";

    if (!audioUrl) {
      return NextResponse.json({ error: "Missing audio URL" }, { status: 400 });
    }

    const parsedUrl = new URL(audioUrl);
    // Security check: only allow downloads from our Cloudflare R2 bucket endpoint
    const expectedHostname = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    if (parsedUrl.hostname !== expectedHostname && !parsedUrl.hostname.endsWith(".r2.cloudflarestorage.com")) {
      return NextResponse.json({ error: "Unauthorized download source" }, { status: 403 });
    }

    const response = await fetch(audioUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch audio file" }, { status: 502 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set("Content-Type", response.headers.get("Content-Type") || "audio/wav");
    headers.set("Content-Length", arrayBuffer.byteLength.toString());

    return new Response(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    logger.error({ error }, "Audio download proxy failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
