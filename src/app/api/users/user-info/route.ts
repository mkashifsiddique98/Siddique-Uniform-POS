import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    name: auth.user.name || "User",
    email: auth.user.email,
    role: auth.user.role,
    _id: auth.user.userId,
  });
}
