import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadProofImage, getSignedUrlForKey } from "@/lib/r2";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`upload:${userId}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpg, jpeg, png, webp, pdf" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split("/")[1];
    const key = `proofs/${orgId}/${Date.now()}.${ext}`;

    await uploadProofImage(buffer, key, file.type);

    const signedUrl = await getSignedUrlForKey(key, 259200);

    return NextResponse.json({ key, url: signedUrl });
  } catch (error) {
    logger.error({ error }, "Failed to upload proof image");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
