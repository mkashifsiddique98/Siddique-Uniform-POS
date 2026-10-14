import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
<<<<<<< HEAD
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
=======

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

  const uploadDir = path.join(process.cwd(), "public/uploads");

  await fs.mkdir(uploadDir, { recursive: true });

  const savedFiles = [];

  for (const file of files) {
<<<<<<< HEAD
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
=======
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = path.join(uploadDir, file.name);

    await fs.writeFile(filePath, buffer);

    savedFiles.push(`/uploads/${file.name}`);
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  }

  return NextResponse.json({ message: "Files uploaded", files: savedFiles });
}
