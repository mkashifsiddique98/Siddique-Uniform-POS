import connectDB from "@/utils/connectDB";
import User from "@/models/user";
import { hashPassword } from "@/lib/password";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateUserSchema } from "@/validation/user";

connectDB();

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const auth = await requireAuth(req, { role: "admin" });
    if (!auth.ok) return auth.response;
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

export async function PUT(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const auth = await requireAuth(req, { role: "admin" });
    if (!auth.ok) return auth.response;
    const { userId } = params;
    const parsed = updateUserSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.password) {
      update.password = await hashPassword(parsed.data.password);
    } else {
      delete update.password;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User updated successfully", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
