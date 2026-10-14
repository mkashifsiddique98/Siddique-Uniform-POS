import connectDB from "@/utils/connectDB";
import User from "@/models/user";
import { hashPassword } from "@/lib/password";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createUserSchema } from "@/validation/user";

connectDB();

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req, { role: "admin" });
    if (!auth.ok) return auth.response;
    const parsed = createUserSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { name, email, password, role, pages } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      pages,
    });

    await newUser.save();

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req, { role: "admin" });
    if (!auth.ok) return auth.response;
    const UserList = await User.find().select("-password");
    return NextResponse.json(UserList, { status: 200 });
  } catch (error) {
    console.error("Error Getting user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}