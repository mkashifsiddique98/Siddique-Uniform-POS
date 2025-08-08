import connectDB from "@/utils/connectDB";
import User from "@/models/user";
import { NextResponse } from "next/server";

connectDB();

export async function POST(req: Request) {
  try {
    const { name, email, password, role, pages } = await req.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const newUser = new User({
      name,
      email,
      password,
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
    const UserList = await User.find();
    return NextResponse.json(UserList, { status: 200 });
  } catch (error) {
    console.error("Error Getting user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}