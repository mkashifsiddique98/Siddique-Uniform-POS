import { NextResponse } from "next/server";
<<<<<<< HEAD
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
=======
import { jwtVerify } from "jose";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie
    .split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    // return only needed user info
    const userData = {
      name: (payload as any).name || "User",
      email: (payload as any).email,
      role: (payload as any).role,
      _id:(payload as any).userId,
    };

    return NextResponse.json(userData);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
}
