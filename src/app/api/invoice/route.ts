import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Customer from "@/models/customer";
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
      dueDate, // for Special Customer
      discount,
    } = req;

    // Determine status based on dueDate
    const status = dueDate == null ? "Clear" : "Pending";
   

    // Check if an invoice with the given invoiceNo exists
    const existingInvoice = await Invoice.findOne({ invoiceNo });

    if (existingInvoice) {
      // Update the existing invoice with new details
      existingInvoice.customer = customer;
      existingInvoice.productDetail = productDetail;
      existingInvoice.prevBalance = prevBalance | 0;
      existingInvoice.grandTotal = grandTotal;
      existingInvoice.anyMessage = anyMessage;
      existingInvoice.dueDate = dueDate;
      existingInvoice.status = status;
      existingInvoice.discount = discount;
      const updatedInvoice = await existingInvoice.save();
      
      // Update Customer Details 
      if (existingInvoice.customer.prevBalance !== 0) {
        const updatedCustomer = await Customer.findByIdAndUpdate(
          existingInvoice.customer._id,
          { $set: existingInvoice.customer },
          { new: true }
        );
     }
     
      return NextResponse.json({ response: updatedInvoice, message: "Invoice updated" }, { status: 200 });
    } else {
      // Create a new invoice if not found
      const invoiceDate = new Date().toISOString();
      const newInvoice = new Invoice({
        invoiceNo,
        customer, // customer details
        productDetail,
        prevBalance,
        grandTotal,
        anyMessage,
        invoiceDate,
        dueDate,
        status,
        discount,
      });

      const savedInvoice = await newInvoice.save();
      return NextResponse.json({ response: savedInvoice, message: "Invoice created" }, { status: 201 });
    }
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