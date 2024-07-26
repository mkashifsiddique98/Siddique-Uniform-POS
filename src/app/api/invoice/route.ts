import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
connectDB();
// Need To Edit
// Create New Customer
export async function POST(request: Request) {
  try {
    const req = await request.json();
    const { invoiceNo, customerId, productDetail, prevBalance, anyMessage ,grandTotal} = req;
    const invoiceDate = new Date().toISOString();
    const newInvoice = new Invoice({
      invoiceNo,
      customer: new mongoose.Types.ObjectId(customerId),
      productDetail,
      prevBalance,
      grandTotal,
      anyMessage,
      invoiceDate,
    });
    const SaveInvoice = await newInvoice.save();

    return Response.json({ response: SaveInvoice }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function GET(request: Request) {
  try {
    
    const invoices = await Invoice.find()
    // .populate('customer');
    return Response.json({ response: invoices }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
