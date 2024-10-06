import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

connectDB();

export async function GET(request: Request) {
  try {
    // Fetch the last invoice sorted by invoiceNo in descending order
    const lastInvoice = await Invoice.findOne().sort({ invoiceNo: -1 });

    // Determine the next invoice number
    const lastInvoiceNo = lastInvoice ? lastInvoice.invoiceNo : 0;
    const newInvoiceNumber = lastInvoiceNo + 1;
    // Set cache control headers to disable caching

    // Return the new invoice number
    const response = NextResponse.json(
      { response: newInvoiceNumber },
      { status: 200 }
    );
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
