import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
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
      customer,
      productDetail,
      prevBalance,
      anyMessage,
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
  } catch (error) {
    console.error(error);
    console.error("Error populating customer:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
  }
}