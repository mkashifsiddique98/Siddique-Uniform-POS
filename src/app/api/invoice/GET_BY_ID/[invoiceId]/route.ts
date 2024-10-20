
import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
connectDB();
// Get Invoice by ID (GET /api/invoice/[id])
export async function GET(request: Request, { params }: { params: { invoiceId: string } }) {
    try {
      const { invoiceId } = params;
       const id = invoiceId
      // Ensure the ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
      }
  
      const invoice = await Invoice.findById(id);
     
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
  
      return NextResponse.json({ response: invoice }, { status: 200 });
    } catch (error) {
      console.error("Error fetching invoice by ID:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }