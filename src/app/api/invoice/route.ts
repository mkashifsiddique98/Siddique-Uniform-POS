import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
<<<<<<< HEAD
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { invoicePayloadSchema } from "@/validation/pos";
import { requireAuth } from "@/lib/auth";
import { normalizeInvoiceForRead } from "@/lib/posHelpers";
import { InvoiceError, deleteInvoiceWithStock, getNextInvoicePreview, saveInvoiceWithStock } from "@/lib/invoiceService";

connectDB();

function invoiceErrorResponse(error: any) {
  if (error instanceof InvoiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error?.code === 11000) {
    return NextResponse.json({ error: "Invoice number already exists" }, { status: 409 });
  }
  if (/Transaction numbers are only allowed/i.test(String(error?.message))) {
    return NextResponse.json(
      { error: "MongoDB must run as a replica set to support transactions. See the README." },
      { status: 500 }
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const req = await request.json();
    const parsed = invoicePayloadSchema.safeParse(req);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid invoice payload" }, { status: 400 });
    }

    const { invoiceNo, isEdit, idempotencyKey, customer, productDetail, prevBalance, anyMessage, dueDate, discount, grandTotal } =
      parsed.data;

    await connectDB();
    const { invoice, created, duplicate } = await saveInvoiceWithStock({
      invoiceNo,
      isEdit,
      idempotencyKey,
=======
import { NextResponse } from "next/server";
import Customer from "@/models/customer";
connectDB();
// ********************************Create New Customer*******************************
export async function POST(request: Request) {
  try {
    const req = await request.json();
    const {
      invoiceNo,
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
      customer,
      productDetail,
      prevBalance,
      anyMessage,
<<<<<<< HEAD
      dueDate,
      discount,
      grandTotal,
      invoiceDate: new Date().toISOString(),
    }, String(user.userId || ""));

    // Read-only preview for the UI; a failure here must not fail an already saved invoice
    const nextInvoiceNo = await getNextInvoicePreview().catch(() => Number(invoice.invoiceNo) + 1);

    return NextResponse.json(
      {
        response: normalizeInvoiceForRead(invoice),
        invoiceNo: invoice.invoiceNo,
        nextInvoiceNo,
        duplicate: Boolean(duplicate),
        message: duplicate ? "Invoice already saved" : created ? "Invoice created" : "Invoice updated",
      },
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    return invoiceErrorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const invoices = await Invoice.find();
    return Response.json({ response: invoices.map((invoice) => normalizeInvoiceForRead(invoice)) }, { status: 200 });
=======
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
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  } catch (error) {
    console.error(error);
    console.error("Error populating customer:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
<<<<<<< HEAD

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { id, confirm } = await request.json();
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "A valid invoice id is required" }, { status: 400 });
    }

    await connectDB();
    await deleteInvoiceWithStock(String(id), String(user.userId || ""), {
      isAdmin: user.role?.toLowerCase() === "admin",
      confirmed: confirm === true,
    });

    return NextResponse.json({ message: "Invoice deleted successfully" }, { status: 200 });
  } catch (error) {
    return invoiceErrorResponse(error);
=======
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
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  }
}