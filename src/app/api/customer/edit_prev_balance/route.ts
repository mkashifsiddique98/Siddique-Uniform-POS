import connectDB from "@/utils/connectDB";
import Customer from "@/models/customer";
import { NextResponse } from "next/server";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";
connectDB();
export async function PUT(request: Request) {
    try {
  const auth = await requireAuth(request, { page: "customer" });
  if (!auth.ok) return auth.response;
=======
connectDB();
export async function PUT(request: Request) {
    try {
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
      
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