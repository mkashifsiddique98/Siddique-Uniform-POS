import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";
import { normalizeInvoiceForRead } from "@/lib/posHelpers";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
connectDB();
// Get Invoice by ID (GET /api/invoice/[id])
export async function POST(request: Request) {
    try {
<<<<<<< HEAD
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
        const { invoiceNo } = await request.json();
        
    // Search by invoice number
    const invoice = await Invoice.findOne({ invoiceNo: Number(invoiceNo) });
   
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
  
<<<<<<< HEAD
      return NextResponse.json({ response: normalizeInvoiceForRead(invoice) }, { status: 200 });
=======
      return NextResponse.json({ response: invoice }, { status: 200 });
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    } catch (error) {
      console.error("Error fetching invoice by ID:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }