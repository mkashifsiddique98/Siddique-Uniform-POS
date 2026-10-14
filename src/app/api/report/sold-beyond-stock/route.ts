import { NextResponse } from "next/server";
import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { requireAuth } from "@/lib/auth";
import { summarizeSoldBeyondStock } from "@/lib/soldBeyondStock";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  try {
    await connectDB();
    const invoices = await Invoice.find({ voided: { $ne: true }, "productDetail.unstockedQty": { $gt: 0 } })
      .select("invoiceNo invoiceDate voided productDetail.productId productDetail.productName productDetail.unstockedQty")
      .lean();
    return NextResponse.json({ response: summarizeSoldBeyondStock(invoices) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
