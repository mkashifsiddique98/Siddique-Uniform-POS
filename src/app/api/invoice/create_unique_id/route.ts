import connectDB from "@/utils/connectDB";
<<<<<<< HEAD
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getNextInvoicePreview } from "@/lib/invoiceService";

connectDB();

// Read-only preview of the next invoice number. It never writes: the real number is
// assigned by the server when the invoice is saved (POST /api/invoice).
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    await connectDB();
    const nextInvoiceNo = await getNextInvoicePreview();

    const response = NextResponse.json({ response: nextInvoiceNo }, { status: 200 });
=======
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
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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
