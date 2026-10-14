import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/utils/connectDB";
import Wholesaler from "@/models/wholesaler";
import Purchase from "@/models/purchase";
import { requireAuth } from "@/lib/auth";

connectDB();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid wholesaler ID" }, { status: 400 });
  }

  try {
    const wholesaler = await Wholesaler.exists({ _id: params.id });
    if (!wholesaler) return NextResponse.json({ error: "Wholesaler not found" }, { status: 404 });

    const rows = await Purchase.aggregate([
      { $match: { "wholesaler._id": new mongoose.Types.ObjectId(params.id) } },
      { $unwind: { path: "$products", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: {
            productId: "$products._id",
            productName: "$products.productName",
          },
          quantity: { $sum: { $ifNull: ["$products.quantity", 0] } },
          value: {
            $sum: {
              $multiply: [
                { $ifNull: ["$products.productCost", 0] },
                { $ifNull: ["$products.quantity", 0] },
              ],
            },
          },
        },
      },
      { $sort: { value: -1 } },
    ]);

    return NextResponse.json({
      rows: rows.map((row) => ({
        productId: row._id?.productId ? String(row._id.productId) : null,
        productName: row._id?.productName || "Archived product",
        quantity: Number(row.quantity || 0),
        value: Number(row.value || 0),
      })),
      dataMode: "supplier-purchases",
    });
  } catch (error) {
    console.error("Wholesaler products error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
