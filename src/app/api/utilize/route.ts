import Utilize from "@/models/utilize";
import connectDB from "@/utils/connectDB";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  const created = await Utilize.create(data);
  return NextResponse.json(created);
}

export async function GET() {
  await connectDB();
  const all = await Utilize.find().sort({ createdAt: -1 }).populate("category");
  return NextResponse.json(all);
}

export async function PUT(req: Request) {
  await connectDB();
  const { data, id } = await req.json();
  const updated = await Utilize.findByIdAndUpdate(id, data, { new: true });
  return NextResponse.json(updated);
}
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const deleted = await Utilize.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
