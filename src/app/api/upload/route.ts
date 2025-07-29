import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  const uploadDir = path.join(process.cwd(), "public/uploads");

  await fs.mkdir(uploadDir, { recursive: true });

  const savedFiles = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = path.join(uploadDir, file.name);

    await fs.writeFile(filePath, buffer);

    savedFiles.push(`/uploads/${file.name}`);
  }

  return NextResponse.json({ message: "Files uploaded", files: savedFiles });
}
