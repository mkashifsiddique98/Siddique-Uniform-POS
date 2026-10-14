import connectDB from "@/utils/connectDB";
import Purchase from "@/models/purchase";
import { NextResponse } from "next/server";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
import mongoose from "mongoose";
connectDB();
// Get Invoice by ID (GET /api/invoice/[id])
export async function GET(request: Request, { params }: { params: { purchaseId: string } }) {
    try {
<<<<<<< HEAD
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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