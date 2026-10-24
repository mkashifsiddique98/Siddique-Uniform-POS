import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const dynamic = "force-dynamic"; // never cache

// Lightweight: no auth, no DB query. Reports the state of the existing driver connection only.
// readyState 0 is normal before the first DB request (the connection is opened lazily).
export async function GET() {
  const state = mongoose.connection.readyState;
  const mongoOk = state !== 3;
  return NextResponse.json(
    {
      status: mongoOk ? "ok" : "unhealthy",
      uptimeSec: Math.round(process.uptime()),
      mongo: { ok: mongoOk, state },
    },
    { status: mongoOk ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}