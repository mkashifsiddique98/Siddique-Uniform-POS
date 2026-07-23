// app/api/images/route.ts (Next.js App Router API route)

import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const files = await fs.readdir(uploadDir);

    // Filter image files (optional)
    const imageFiles = files.filter((file) =>
      /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file)
    );

    // Map to public URLs
    const images = imageFiles.map((file) => `/uploads/${file}`);

    return NextResponse.json({ success: true, images });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to read images" },
      { status: 500 }
    );
  }
}
