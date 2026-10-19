import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/utils/connectDB";

export const dynamic = "force-dynamic"; // never cache

export async function GET() {
  const start = Date.now();
  let mongoOk = false;
  let detail: string | undefined;

  try {
    await Promise.race([
      (async () => {
        await dbConnect();
        await mongoose.connection.db!.admin().ping();
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    mongoOk = true;
  } catch (e: any) {
    detail = e?.message ?? "error";
  }

  return NextResponse.json(
    {
      status: mongoOk ? "ok" : "unhealthy",
      time: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      mongo: { ok: mongoOk, ms: Date.now() - start, detail },
    },
    { status: mongoOk ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}