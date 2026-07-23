import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

connectDB();

export async function POST(request: Request) {
    try {
        const adjustments = await request.json();
        console.log(adjustments,"adjustments")
        const updatedProducts = adjustments.map(async (
            { _id, productCost, quantity }: { _id: object, productCost: number, quantity: number }
        ) => {
            return await Product.findByIdAndUpdate(
                _id,
                { productCost, quantity },
                { new: true }
            );
        })


        console.log("Updated Products:", updatedProducts);

        return NextResponse.json({ response: updatedProducts }, { status: 200 });
    } catch (error) {
        console.error("Error adjusting products:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
