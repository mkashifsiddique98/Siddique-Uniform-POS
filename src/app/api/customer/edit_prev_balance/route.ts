import connectDB from "@/utils/connectDB";
import Customer from "@/models/customer";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
connectDB();
export async function PUT(request: Request) {
    try {
  const auth = await requireAuth(request, { page: "customer" });
  if (!auth.ok) return auth.response;
      
      const updatedData = await request.json();
      const updatedCustomer = await Customer.findByIdAndUpdate(
        updatedData._id,
        { $set: updatedData },
        { new: true }
      );
  
      if (!updatedCustomer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
       
      return NextResponse.json({ updatedCustomer }, { status: 200 });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }