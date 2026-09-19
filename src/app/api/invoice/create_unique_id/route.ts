import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import InvoiceCounter from "@/models/InvoiceCounter";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

connectDB();

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const counter = await InvoiceCounter.findOneAndUpdate(
      { _id: "invoiceNo" },
      [
        { $set: { seq: { $ifNull: ["$seq", 0] } } },
        { $set: { seq: { $add: ["$seq", 1] } } },
      ],
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    let nextInvoiceNo = counter?.seq ?? 1;

    const lastInvoice = await Invoice.findOne()
      .sort({ invoiceNo: -1 })
      .select({ invoiceNo: 1 })
      .lean() as { invoiceNo?: number } | null;
    if (lastInvoice && Number(lastInvoice.invoiceNo || 0) >= nextInvoiceNo) {
      nextInvoiceNo = Number(lastInvoice.invoiceNo || 0) + 1;
      await InvoiceCounter.findOneAndUpdate(
        { _id: "invoiceNo" },
        { $set: { seq: nextInvoiceNo } },
        { upsert: true, new: true }
      );
    }

    const response = NextResponse.json({ response: nextInvoiceNo }, { status: 200 });
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    return response;
  } catch (error) {
    console.error("Error fetching invoice", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
