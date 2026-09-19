import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

connectDB();

export async function POST(request: Request) {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    try {
        const adjustments = await request.json();
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
