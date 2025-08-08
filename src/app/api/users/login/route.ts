import { NextResponse } from "next/server";
import connectDB from "@/utils/connectDB";
import User from "@/models/user";

import jwt from "jsonwebtoken";

connectDB();

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ error: "Invalid email" }, { status: 401 });
  }

  let isMatch;
  isMatch = password == user.password ? true : false;
  if (!isMatch) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  
  const token = jwt.sign(
    {
      userId: user._id,
      name:user.name,
      email: user.email,
      role: user.role || "employee",
      pages: user.pages || [],
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );

  const response = NextResponse.json({ message: "Login successful" });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
}
