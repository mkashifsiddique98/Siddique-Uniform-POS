import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Customer from "@/models/customer"
connectDB();

// *********************************Update Invoice Status ****************************
export async function PATCH(request: Request) {
  try {
    const req = await request.json();
    const { id, status } = req;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      { status,prevBalance:0 },
      { new: true } // Return the updated document
    );
    

    if (!updatedInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    const invoice = await Invoice.findById(id)
    const customerId = invoice?.customer._id
    const updateCustomer = await Customer.findByIdAndUpdate(
      customerId,
      { prevBalance:0 },
      { new: true } 
    );
    return NextResponse.json({ response: updatedInvoice }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
