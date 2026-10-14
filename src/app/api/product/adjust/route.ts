import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

connectDB();

export async function POST(request: Request) {
    const auth = await requireAuth(request, { page: "product" });
    if (!auth.ok) return auth.response;
    try {
        const adjustments = await request.json();
        const invalid = (Array.isArray(adjustments) ? adjustments : []).find(
            ({ quantity }: { quantity: number }) => !Number.isFinite(Number(quantity)) || Number(quantity) < 0
        );
        if (invalid) {
            return NextResponse.json({ error: "Stock cannot be negative" }, { status: 400 });
        }
        const updatedProducts = adjustments.map(async (
            { _id, productCost, quantity }: { _id: object, productCost: number, quantity: number }
        ) => {
            return await Product.findByIdAndUpdate(
                _id,
                { productCost, quantity },
                { new: true }
            );
        })


        return NextResponse.json({ response: updatedProducts }, { status: 200 });
    } catch (error) {
        console.error("Error adjusting products:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
