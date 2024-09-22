import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
connectDB();
// ********************************Create New Customer*******************************
export async function POST(request: Request) {
  try {
    const req = await request.json();
    const {
      invoiceNo,
      customer,
      productDetail,
      prevBalance,
      anyMessage,
      grandTotal,
      dueDate //for Special Customer
    } = req;
    // Only For Pending 
     const status = dueDate == null ? "Clear" : "Pending";
    const invoiceDate = new Date().toISOString();
    const newInvoice = new Invoice({
      invoiceNo,
      customer: customer, //customer details
      productDetail,
      prevBalance,
      grandTotal,
      anyMessage,
      invoiceDate,
      dueDate,
      status
    });
    const SaveInvoice = await newInvoice.save();

    return Response.json({ response: SaveInvoice }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// *********************************Get All Invoice **************************8
export async function GET(request: Request) {
  try {
    const invoices = await Invoice.find();
    return Response.json({ response: invoices }, { status: 200 });
  } catch (error) {
    console.error(error);
    console.error("Error populating customer:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  
  try {
    const { id } = await request.json(); // Assuming the ID is sent in the request body
     
    const deletedInvoice = await Invoice.findByIdAndDelete(id) // Use the correct deletion method for your database

    if (!deletedInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Invoice deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}