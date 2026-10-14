import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";
import { normalizeInvoiceForRead } from "@/lib/posHelpers";
connectDB();
// Get Invoice by ID (GET /api/invoice/[id])
export async function POST(request: Request) {
    try {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
        const { invoiceNo } = await request.json();
        
    // Search by invoice number
    const invoice = await Invoice.findOne({ invoiceNo: Number(invoiceNo) });
   
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
  
      return NextResponse.json({ response: normalizeInvoiceForRead(invoice) }, { status: 200 });
    } catch (error) {
      console.error("Error fetching invoice by ID:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }