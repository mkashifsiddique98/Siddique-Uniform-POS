import { NextResponse } from "next/server";
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
}
