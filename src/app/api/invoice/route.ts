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
    
    const invoices = await Invoice.find().populate('customer');
    console.log("Server data console.log(invoices);",invoices);
    return Response.json({ response: invoices }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// Get Invoice by ID (GET /api/invoice/[id])
export async function GET_BY_ID(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

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