import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

connectDB();

export async function POST(request: Request) {
<<<<<<< HEAD
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
=======
    try {
        const adjustments = await request.json();
        console.log(adjustments,"adjustments")
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
        const updatedProducts = adjustments.map(async (
            { _id, productCost, quantity }: { _id: object, productCost: number, quantity: number }
        ) => {
            return await Product.findByIdAndUpdate(
                _id,
                { productCost, quantity },
                { new: true }
            );
        })


<<<<<<< HEAD
=======
        console.log("Updated Products:", updatedProducts);

>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
        return NextResponse.json({ response: updatedProducts }, { status: 200 });
    } catch (error) {
        console.error("Error adjusting products:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
