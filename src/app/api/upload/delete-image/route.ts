import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Security check to prevent path traversal
    const safeFilename = path.basename(filename);

    const filePath = path.join(process.cwd(), "public/uploads", safeFilename);

    await fs.unlink(filePath);

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting file:", error);

    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
