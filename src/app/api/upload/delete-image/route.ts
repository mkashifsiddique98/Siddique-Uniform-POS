import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { requireAuth } from "@/lib/auth";
import { safeUploadFilename } from "@/lib/uploadSecurity";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const { filename } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const safeFilename = safeUploadFilename(filename);
    if (!safeFilename) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

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
