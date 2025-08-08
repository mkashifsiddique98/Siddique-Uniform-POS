import connectDB from "@/utils/connectDB";
import WholeSaler from "@/models/wholesaler";
import { NextResponse } from "next/server";
connectDB();

// Create New Whole Saler
export async function POST(request: Request) {
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
  try {
    const listWholeSaler = await WholeSaler.find();
    return Response.json({ listWholeSaler }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
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