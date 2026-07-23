import connectDB from "@/utils/connectDB";
import SCHOOLNAME from "@/models/School-name";
import { NextResponse } from "next/server";

connectDB(); // Connect to MongoDB
// Create New Product
export async function POST(request: Request) {
  try {
    const res = await request.json();
    const newSchoolName = new SCHOOLNAME(res);
    const savedSchoolName = await newSchoolName.save();
    return Response.json({ response: savedSchoolName }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// Get All Product
export async function GET() {
  try {
    const schoolName = await SCHOOLNAME.find();
    return Response.json({ response: schoolName }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
//update product
export async function PUT(request: Request) {
  try {
    const updateData = await request.json();

    const { _id, name, location } = updateData;

    // Use findByIdAndUpdate to update the document by _id
    await SCHOOLNAME.findByIdAndUpdate(_id, { name, location });

    console.log("SCHOOLNAME updated in the database");
    return Response.json({ response: "Products SCHOOLNAME" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// Delete Product by ID
export async function DELETE(request: Request) {
  try {
    const { _id } = await request.json();

    // Use findByIdAndDelete to delete the document by _id
    const deletedProduct = await SCHOOLNAME.findByIdAndDelete(_id);

    if (!deletedProduct) {
      return NextResponse.json({ error: "SCHOOLNAME not found" }, { status: 404 });
    }
    return Response.json({ response: "SCHOOLNAME deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
