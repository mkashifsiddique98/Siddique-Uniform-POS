
import ExpenseCategory from "@/models/ExpenseCategory";
import connectDB from "@/utils/connectDB";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    await connectDB();
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updated = await ExpenseCategory.findByIdAndUpdate(
      params.id,
      { name },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    await connectDB();
    const deleted = await ExpenseCategory.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
