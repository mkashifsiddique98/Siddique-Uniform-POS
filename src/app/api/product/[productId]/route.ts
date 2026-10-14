<<<<<<< HEAD

import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    await connectDB();

    const { productId } = await params;
     
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await Product.findOne({ _id: productId });
    console.log("Fetched product by ID:", product);
    if (!product) {
      return NextResponse.json(
        { status: 404 }
      );
    }
    return NextResponse.json({ response: product }, { status: 200 });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
=======
import connectDB from "@/utils/connectDB";
import Product from "@/models/Product"; // Ensure this model is correctly defined in your models folder
import { NextResponse } from "next/server";
import mongoose from "mongoose";

connectDB();

// Get Product by ID (GET /api/product/[id])
export async function GET(request: Request, { params }: { params: { productId: string } }) {
    try {
        const { productId } = params;
        const id = productId;

        // Ensure the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
        }

        const product = await Product.findById(id);

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ response: product }, { status: 200 });
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
}
