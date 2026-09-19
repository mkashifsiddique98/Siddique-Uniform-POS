import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = await requireAuth(request, { role: "admin" });
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { error: "Web updates are disabled. Run Update-software-pos.bat locally." },
    { status: 403 }
  );
}
