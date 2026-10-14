import { NextResponse } from "next/server";
import connectDB from "@/utils/connectDB";
import User from "@/models/user";
import { compareOrMigratePassword } from "@/lib/password";

import { SignJWT } from "jose";

const failedAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  try {
    await connectDB();

    const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const current = failedAttempts.get(clientKey);
    if (current && current.blockedUntil > Date.now()) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const body = await req.json() as { email?: unknown; password?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const email = body.email.trim();
    const password = body.password;

    const user = await User.findOne({ email });
    if (!user) {
      recordFailure(clientKey);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await compareOrMigratePassword(user, password);
    if (!isMatch) {
      recordFailure(clientKey);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    failedAttempts.delete(clientKey);

    const token = await new SignJWT({
        userId: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role || "employee",
        pages: Array.from(user.pages || [], (page) => String(page)),
      })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    const response = NextResponse.json({ message: "Login successful" });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Unable to log in" }, { status: 500 });
  }
}

function recordFailure(clientKey: string): void {
  const current = failedAttempts.get(clientKey) || { count: 0, blockedUntil: 0 };
  const count = current.count + 1;
  failedAttempts.set(clientKey, {
    count,
    blockedUntil: count >= MAX_ATTEMPTS ? Date.now() + BLOCK_MS : 0,
  });
}
