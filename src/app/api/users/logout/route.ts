import { NextResponse } from "next/server";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
=======

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set("token", "", { path: "/", maxAge: 0 });
  return response;
}
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
