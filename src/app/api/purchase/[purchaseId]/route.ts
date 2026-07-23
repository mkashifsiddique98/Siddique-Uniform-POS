import connectDB from "@/utils/connectDB";
import Purchase from "@/models/purchase";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
connectDB();
// Get Invoice by ID (GET /api/invoice/[id])
export async function GET(request: Request, { params }: { params: { purchaseId: string } }) {
    try {
      const { purchaseId } = params;
       const id = purchaseId
      // Ensure the ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
      }
  
      const purchase = await Purchase.findById(id);
     
      if (!purchase) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
  
      return NextResponse.json({ response: purchase }, { status: 200 });
    } catch (error) {
      console.error("Error fetching invoice by ID:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }