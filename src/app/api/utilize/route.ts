import Utilize from "@/models/utilize";
import connectDB from "@/utils/connectDB";
import { NextResponse } from "next/server";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireAuth(req, { page: "utilize" });
  if (!auth.ok) return auth.response;
=======

export async function POST(req: Request) {
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  await connectDB();
  const data = await req.json();
  const created = await Utilize.create(data);
  return NextResponse.json(created);
}

<<<<<<< HEAD
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
=======
export async function GET() {
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  await connectDB();
  const all = await Utilize.find().sort({ createdAt: -1 });
  // i Add Exe for populate issue let see it work or not 
  return NextResponse.json(all);
}

export async function PUT(req: Request) {
<<<<<<< HEAD
  const auth = await requireAuth(req, { page: "utilize" });
  if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  await connectDB();
  const { data, id } = await req.json();
  const updated = await Utilize.findByIdAndUpdate(id, data, { new: true });
  return NextResponse.json(updated);
}
export async function DELETE(req: Request) {
<<<<<<< HEAD
  const auth = await requireAuth(req, { page: "utilize" });
  if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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
