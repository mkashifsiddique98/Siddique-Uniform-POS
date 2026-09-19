import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { NextResponse } from "next/server";
import Customer from "@/models/customer";
import Product from "@/models/Product";
import { invoicePayloadSchema } from "@/validation/pos";
import { getVerifiedUser } from "@/lib/auth";
import { calculateInvoiceTotals } from "@/lib/posHelpers";

connectDB();

function normalizeInvoicePayload(payload: any) {
  const safeDiscount = Number(payload.discount || 0);
  const productDetail = Array.isArray(payload.productDetail) ? payload.productDetail : [];
  const totals = calculateInvoiceTotals({ items: productDetail, discount: safeDiscount });

  return {
    ...payload,
    productDetail,
    grandTotal: Number(payload.grandTotal ?? totals.grandTotal),
    prevBalance: Number(payload.prevBalance || 0),
    discount: safeDiscount,
    status: payload.dueDate == null ? "Clear" : "Pending",
    invoiceDate: payload.invoiceDate ?? new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const user = await getVerifiedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const req = await request.json();
    const parsed = invoicePayloadSchema.safeParse(req);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid invoice payload" }, { status: 400 });
    }

    const calculatedTotals = calculateInvoiceTotals({
      items: parsed.data.productDetail,
      discount: parsed.data.discount || 0,
    });
    const submittedGrandTotal = Number(parsed.data.grandTotal || 0);
    if (Math.abs(submittedGrandTotal - calculatedTotals.grandTotal) > 0.01) {
      return NextResponse.json({ error: "Invoice total does not match product lines and discount" }, { status: 400 });
    }

    const normalized = normalizeInvoicePayload({
      ...parsed.data,
      grandTotal: calculatedTotals.grandTotal,
    });
    const { invoiceNo, customer, productDetail, prevBalance, anyMessage, grandTotal, dueDate, discount } = normalized;

    const existingInvoice = await Invoice.findOne({ invoiceNo });

    if (existingInvoice) {
      existingInvoice.customer = customer;
      existingInvoice.productDetail = productDetail;
      existingInvoice.prevBalance = Number(prevBalance || 0);
      existingInvoice.grandTotal = Number(grandTotal || 0);
      existingInvoice.anyMessage = anyMessage || "";
      existingInvoice.dueDate = dueDate || null;
      existingInvoice.status = dueDate == null ? "Clear" : "Pending";
      existingInvoice.discount = Number(discount || 0);
      const updatedInvoice = await existingInvoice.save();

      if (customer && customer._id) {
        await Customer.findByIdAndUpdate(customer._id, { $set: customer }, { new: true });
      }

      return NextResponse.json({ response: updatedInvoice, message: "Invoice updated" }, { status: 200 });
    }

    const newInvoice = new Invoice({
      invoiceNo,
      customer,
      productDetail,
      prevBalance: Number(prevBalance || 0),
      grandTotal: Number(grandTotal || 0),
      anyMessage: anyMessage || "",
      invoiceDate: normalized.invoiceDate,
      dueDate: dueDate || null,
      status: dueDate == null ? "Clear" : "Pending",
      discount: Number(discount || 0),
    });

    const savedInvoice = await newInvoice.save();
    return NextResponse.json({ response: savedInvoice, message: "Invoice created" }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getVerifiedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const user = await getVerifiedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    const deletedInvoice = await Invoice.findByIdAndDelete(id);

    if (!deletedInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Invoice deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}