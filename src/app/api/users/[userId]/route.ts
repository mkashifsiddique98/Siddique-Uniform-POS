import connectDB from "@/utils/connectDB";
import User from "@/models/user";
import { NextResponse } from "next/server";

// Ensure DB is connected
connectDB();

// DELETE a user by ID
export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// UPDATE a user by ID
export async function PUT(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await req.json();
  
    const updatedUser = await User.findByIdAndUpdate(userId, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User updated successfully", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
