import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

connectDB(); // Connect to MongoDB
// Create New Product

export async function POST(request: Request) {
  try {
    const res = await request.json();
    const newProduct = new Product(res);
    const savedProduct = await newProduct.save();

    return Response.json({ response: savedProduct }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// Get All Product
export async function GET() {
  try {
    const products = await Product.find();
    return Response.json({ response: products }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
//update product
export async function PUT(request: Request) {
  try {
    const updateData = await request.json();
    const {
      productid,
      productName,
      schoolName,
      supplier,
      size,
      sellPrice,
      wholesalePrice,
      category,
      quantity,
      isBundle,
      components,
      images,
    } = updateData;

    // Use findByIdAndUpdate to update the document by _id
    const updatedProduct = await Product.findByIdAndUpdate(
      productid,
      {
        productName,
        schoolName,
        supplier,
        size,
        sellPrice,
        wholesalePrice,
        category,
        quantity,
        isBundle,
        components,
        images,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log("Updated product:", updatedProduct);

    return NextResponse.json(
      { response: "Product updated", updatedProduct },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Delete Product by ID
export async function DELETE(request: Request) {
  try {
    const { _id } = await request.json();

    // Use findByIdAndDelete to delete the document by _id
    const deletedProduct = await Product.findByIdAndDelete(_id);

    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return Response.json({ response: "Product deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
