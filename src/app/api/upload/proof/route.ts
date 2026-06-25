import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadProofImage, getSignedUrlForKey } from "@/lib/r2";
import { env } from "@/lib/env";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
}
