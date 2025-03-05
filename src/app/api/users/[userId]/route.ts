import connectDB from "@/utils/connectDB";
import User from "@/models/user";
import { NextResponse } from "next/server";

// Ensure DB is connected
connectDB();

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Attempt to delete the user by ID
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
