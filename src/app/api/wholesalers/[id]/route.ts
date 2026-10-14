import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/utils/connectDB";
import Wholesaler from "@/models/wholesaler";
import Purchase from "@/models/purchase";
import { requireAuth } from "@/lib/auth";
import { buildSupplierLedger } from "@/lib/wholesalerLedger";
import { toSupplierLedgerInput, PurchaseRecord } from "@/lib/wholesalerData";

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
    const wholesaler = await Wholesaler.findById(params.id).lean();
    if (!wholesaler) return NextResponse.json({ error: "Wholesaler not found" }, { status: 404 });

    const purchases = (await Purchase.find({ "wholesaler._id": params.id })
      .sort({ createdAt: 1, _id: 1 })
      .lean()) as unknown as PurchaseRecord[];
    const ledger = buildSupplierLedger(purchases.map(toSupplierLedgerInput), 0);
    const orderCount = purchases.length;
    const firstPurchaseDate = purchases[0]?.createdAt || null;
    const lastPurchaseDate = purchases.at(-1)?.createdAt || null;

    const topProducts = await Purchase.aggregate([
      { $match: { "wholesaler._id": new mongoose.Types.ObjectId(params.id) } },
      { $unwind: { path: "$products", preserveNullAndEmptyArrays: true } },
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
      { $limit: 10 },
    ]);

    return NextResponse.json({
      profile: {
        id: String(wholesaler._id),
        name: wholesaler.name,
        contact: wholesaler.phone,
        shop: wholesaler.location,
        paymentStatus: wholesaler.paymentStatus,
        outstandingBalance: Number(wholesaler.pendingBalance || ledger.totals.outstanding),
      },
      kpis: {
        lifetimeNetSales: 0,
        lifetimeNetPurchases: ledger.totals.purchased,
        orderCount,
        averageOrderValue: orderCount ? ledger.totals.purchased / orderCount : 0,
        returnRate: 0,
        outstandingBalance: Number(wholesaler.pendingBalance || ledger.totals.outstanding),
        firstPurchaseDate,
        lastPurchaseDate,
      },
      topProducts: topProducts.map((product) => ({
        productId: product._id?.productId ? String(product._id.productId) : null,
        productName: product._id?.productName || "Archived product",
        quantity: Number(product.quantity || 0),
        value: Number(product.value || 0),
      })),
      dataGaps: ["Sales and returns are not linked to wholesalers", "Payments are represented only by purchase isPaid flags"],
    });
  } catch (error) {
    console.error("Wholesaler detail error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
