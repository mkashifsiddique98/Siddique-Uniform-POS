import connectDB from "@/utils/connectDB";
import WholeSaler from "@/models/wholesaler";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
connectDB();

// Create New Whole Saler
export async function POST(request: Request) {
  const auth = await requireAuth(request, { page: "purchase" });
  if (!auth.ok) return auth.response;
  try {
    const res = await request.json();
    const newWholeSaler = new WholeSaler(res);
 
    const savedWholeSaler = await newWholeSaler.save();
    return Response.json({ response: savedWholeSaler }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  try {
    const listWholeSaler = await WholeSaler.find();
    return Response.json({ listWholeSaler }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  const auth = await requireAuth(request, { page: "purchase" });
  if (!auth.ok) return auth.response;
  try {
    const { id } = await request.json(); // Assuming the ID is sent in the request body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const deletedWholeSaler = await WholeSaler.findByIdAndDelete(id);

    if (!deletedWholeSaler) {
      return NextResponse.json({ error: "WholeSaler not found" }, { status: 404 });
    }

    return NextResponse.json({ response: "WholeSaler deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}