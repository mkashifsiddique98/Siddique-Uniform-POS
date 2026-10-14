import { NextResponse } from "next/server";
import connectDB from "@/utils/connectDB";
import Setting from "@/models/setting";
import { requireAuth } from "@/lib/auth";
import { SETTINGS_ID, getGlobalOversellMode, normalizeOversellMode } from "@/lib/oversell";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  await connectDB();
  return NextResponse.json({ oversellMode: await getGlobalOversellMode() });
}

export async function PUT(request: Request) {
  const auth = await requireAuth(request, { role: "admin" });
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  const oversellMode = normalizeOversellMode(body?.oversellMode);
  if (!oversellMode) {
    return NextResponse.json({ error: 'oversellMode must be "clamp" or "block"' }, { status: 400 });
  }
  await connectDB();
  await Setting.updateOne({ _id: SETTINGS_ID }, { $set: { oversellMode } }, { upsert: true });
  return NextResponse.json({ oversellMode });
}
