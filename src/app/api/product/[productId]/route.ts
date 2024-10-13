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
}
