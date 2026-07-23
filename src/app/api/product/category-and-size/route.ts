import connectDB from "@/utils/connectDB";
import SizeTemplate from "@/models/size-template";
import { NextResponse } from "next/server";

connectDB();

// Get all size templates
export async function GET() {
  try {
    const sizeTemplates = await SizeTemplate.find();
    return NextResponse.json(sizeTemplates, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Create a new size template
export async function POST(request: Request) {
  try {
    const res = await request.json();
    const newSizeTemplate = new SizeTemplate(res);
    const savedTemplate = await newSizeTemplate.save();
    return NextResponse.json({ response: savedTemplate }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Update a size template
export async function PUT(request: Request) {
  try {
    const res = await request.json();
    const { _id, name, sizes } = res
    console.log("new resposne:",res);
    if (!_id) {
      return NextResponse.json({ message: "SizeTemplate ID is required" }, { status: 400 });
    }

    const updatedTemplate = await SizeTemplate.findByIdAndUpdate(
      _id,
      { name, sizes });
    if (!updatedTemplate) {
      return NextResponse.json({ message: "SizeTemplate not found" }, { status: 404 });
    }
     console.log("updatedTemplate", updatedTemplate)
    return NextResponse.json({ response: updatedTemplate }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Delete a size template
export async function DELETE(request: Request) {
  try {
    const  _id  = await request.json();
    
    if (!_id) {
      return NextResponse.json({ message: "SizeTemplate ID is required" }, { status: 400 });
    }

    const result = await SizeTemplate.deleteOne({_id:_id});
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "SizeTemplate not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "SizeTemplate deleted successfully!" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting SizeTemplate:", error);
    return NextResponse.json({ message: "Error deleting SizeTemplate", error: error?.message }, { status: 500 });
  }
}
