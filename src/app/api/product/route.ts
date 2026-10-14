import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";
import { effectiveOversellMode, getGlobalOversellMode } from "@/lib/oversell";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

connectDB(); // Connect to MongoDB
// Create New Product

export async function POST(request: Request) {
  try {
<<<<<<< HEAD
    const auth = await requireAuth(request, { page: "product" });
    if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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
<<<<<<< HEAD
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  try {
    const [products, globalMode] = await Promise.all([Product.find().lean(), getGlobalOversellMode()]);
    // Every product carries the rule that applies to it, so the POS needs no separate setting call
    const response = products.map((product: any) => ({
      ...product,
      oversellMode: effectiveOversellMode(product.oversellMode, globalMode),
    }));
    return Response.json({ response }, { status: 200 });
=======
export async function GET() {
  try {
    const products = await Product.find();
    return Response.json({ response: products }, { status: 200 });
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
//update product
export async function PUT(request: Request) {
  try {
<<<<<<< HEAD
    const auth = await requireAuth(request, { page: "product" });
    if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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

<<<<<<< HEAD
    if (quantity !== undefined && (!Number.isFinite(Number(quantity)) || Number(quantity) < 0)) {
      return NextResponse.json({ error: "Stock cannot be negative" }, { status: 400 });
    }
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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

    // console.log("Updated product:", updatedProduct);

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
<<<<<<< HEAD
    const auth = await requireAuth(request, { page: "product" });
    if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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
