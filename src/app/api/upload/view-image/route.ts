// app/api/images/route.ts (Next.js App Router API route)

import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

=======

export async function GET() {
  try {
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const files = await fs.readdir(uploadDir);

    // Filter image files (optional)
    const imageFiles = files.filter((file) =>
<<<<<<< HEAD
      /^[a-f0-9-]{36}\.(jpe?g|png|gif|webp)$/i.test(file)
=======
      /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file)
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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
