import connectDB from "@/utils/connectDB";
import SCHOOLNAME from "@/models/School-name";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { TtlCache } from "@/lib/ttlCache";

connectDB(); // Connect to MongoDB

// Rarely changes; every write in this file clears it
const schoolCache = new TtlCache<any[]>(5 * 60 * 1000, 1);
// Create New Product
export async function POST(request: Request) {
  const auth = await requireAuth(request, { page: "product" });
  if (!auth.ok) return auth.response;
  try {
    const res = await request.json();
    const newSchoolName = new SCHOOLNAME(res);
    const savedSchoolName = await newSchoolName.save();
    schoolCache.clear();
    return Response.json({ response: savedSchoolName }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// Get All Product
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  try {
    let schoolName = schoolCache.get("all");
    if (!schoolName) {
      schoolName = await SCHOOLNAME.find();
      schoolCache.set("all", schoolName);
    }
    return Response.json({ response: schoolName }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
//update product
export async function PUT(request: Request) {
  const auth = await requireAuth(request, { page: "product" });
  if (!auth.ok) return auth.response;
  try {
    const updateData = await request.json();

    const { _id, name, location } = updateData;

    // Use findByIdAndUpdate to update the document by _id
    await SCHOOLNAME.findByIdAndUpdate(_id, { name, location });
    schoolCache.clear();

    console.log("SCHOOLNAME updated in the database");
    return Response.json({ response: "Products SCHOOLNAME" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// Delete Product by ID
export async function DELETE(request: Request) {
  const auth = await requireAuth(request, { page: "product" });
  if (!auth.ok) return auth.response;
  try {
    const { _id } = await request.json();

    // Use findByIdAndDelete to delete the document by _id
    const deletedProduct = await SCHOOLNAME.findByIdAndDelete(_id);
    schoolCache.clear();

    if (!deletedProduct) {
      return NextResponse.json({ error: "SCHOOLNAME not found" }, { status: 404 });
    }
    return Response.json({ response: "SCHOOLNAME deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
