import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth";
import { extensionForMimeType, hasValidMagicBytes, MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES } from "@/lib/uploadSecurity";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, { page: "product" });
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);

  if (files.length === 0 || files.length > MAX_UPLOAD_FILES) {
    return NextResponse.json({ error: `Upload between 1 and ${MAX_UPLOAD_FILES} images` }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public/uploads");

  await fs.mkdir(uploadDir, { recursive: true });

  const savedFiles = [];

  for (const file of files) {
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Image must be between 1 byte and 5 MB" }, { status: 400 });
    }
    const extension = extensionForMimeType(file.type);
    if (!extension) {
      return NextResponse.json({ error: "Only PNG, JPEG, GIF, and WebP images are allowed" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!hasValidMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: "Image content does not match its MIME type" }, { status: 400 });
    }
    const filename = `${randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    savedFiles.push(`/uploads/${filename}`);
  }

  return NextResponse.json({ message: "Files uploaded", files: savedFiles });
}
