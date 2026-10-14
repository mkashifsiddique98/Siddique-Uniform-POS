import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/utils/connectDB";
import Wholesaler from "@/models/wholesaler";
import Purchase from "@/models/purchase";
import { requireAuth } from "@/lib/auth";
import { wholesalerListQuerySchema } from "@/validation/wholesalers";

connectDB();

type WholesalerSummary = {
  _id: string;
  name: string;
  location: string;
  phone: string;
  paymentStatus: string;
  pendingBalance: number;
};

type PurchaseAggregate = {
  _id: string;
  totalPurchased: number;
  totalPaid: number;
  orderCount: number;
  lastPurchaseDate?: Date;
};

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const parsedQuery = wholesalerListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json({ error: parsedQuery.error.issues[0]?.message || "Invalid query" }, { status: 400 });
  }

  try {
    const { search, hasOutstanding, from, to, sort, direction, page, limit } = parsedQuery.data;
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }
    if (hasOutstanding === "true") query.pendingBalance = { $gt: 0 };
    if (hasOutstanding === "false") query.pendingBalance = { $lte: 0 };

    const total = await Wholesaler.countDocuments(query);
    const wholesalers = (await Wholesaler.find(query)
      .sort(sort === "outstanding" ? { pendingBalance: direction === "desc" ? -1 : 1 } : { name: direction === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()) as unknown as WholesalerSummary[];

    const ids = wholesalers.map((wholesaler) => new mongoose.Types.ObjectId(String(wholesaler._id)));
    const purchaseMatch: Record<string, unknown> = { "wholesaler._id": { $in: ids } };
    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) createdAt.$gte = new Date(from);
      if (to) createdAt.$lte = new Date(to);
      purchaseMatch.createdAt = createdAt;
    }

    const aggregates = (await Purchase.aggregate<PurchaseAggregate>([
      { $match: purchaseMatch },
      {
        $project: {
          wholesalerId: "$wholesaler._id",
          total: {
            $reduce: {
              input: { $ifNull: ["$products", []] },
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $multiply: [
                      { $ifNull: ["$$this.productCost", 0] },
                      { $ifNull: ["$$this.quantity", 0] },
                    ],
                  },
                ],
              },
            },
          },
          isPaid: 1,
          createdAt: 1,
        },
      },
      {
        $group: {
          _id: "$wholesalerId",
          totalPurchased: { $sum: "$total" },
          totalPaid: { $sum: { $cond: ["$isPaid", "$total", 0] } },
          orderCount: { $sum: 1 },
          lastPurchaseDate: { $max: "$createdAt" },
        },
      },
    ])) as PurchaseAggregate[];

    const aggregateById = new Map(aggregates.map((item) => [String(item._id), item]));
    const rows = wholesalers.map((wholesaler) => {
      const aggregate = aggregateById.get(String(wholesaler._id));
      const totalPurchased = Number(aggregate?.totalPurchased || 0);
      const totalPaid = Number(aggregate?.totalPaid || 0);
      return {
        id: String(wholesaler._id),
        name: wholesaler.name,
        contact: wholesaler.phone,
        shop: wholesaler.location,
        totalPurchased,
        totalReturned: 0,
        netSales: 0,
        netPurchases: totalPurchased,
        totalPaid,
        outstandingBalance: Number(wholesaler.pendingBalance || totalPurchased - totalPaid),
        orderCount: Number(aggregate?.orderCount || 0),
        lastPurchaseDate: aggregate?.lastPurchaseDate || null,
        dataMode: "supplier-purchases",
      };
    });

    const monthStart = new Date();
    monthStart.setHours(0, 0, 0, 0);
    monthStart.setDate(1);
    const [balanceSummary, monthSummary] = await Promise.all([
      Wholesaler.aggregate<{ _id: null; totalOutstanding: number }>([
        { $match: query },
        { $group: { _id: null, totalOutstanding: { $sum: { $ifNull: ["$pendingBalance", 0] } } } },
      ]),
      Purchase.aggregate<{ _id: null; total: number }>([
        { $match: { createdAt: { $gte: monthStart } } },
        {
          $project: {
            total: {
              $reduce: {
                input: { $ifNull: ["$products", []] },
                initialValue: 0,
                in: { $add: ["$$value", { $multiply: [{ $ifNull: ["$$this.productCost", 0] }, { $ifNull: ["$$this.quantity", 0] }] }] },
              },
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    return NextResponse.json({
      rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalWholesalers: total,
        totalOutstanding: Number(balanceSummary[0]?.totalOutstanding || 0),
        monthPurchases: Number(monthSummary[0]?.total || 0),
      },
      dataGaps: ["No wholesale-customer sale/return relationship exists", "No payment collection exists", "No active flag exists"],
    });
  } catch (error) {
    console.error("Wholesaler summary error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
