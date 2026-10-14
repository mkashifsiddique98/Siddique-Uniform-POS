import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/connectDB";
import { requireAuth } from "@/lib/auth";
import { InvoiceError, voidInvoiceWithStock } from "@/lib/invoiceService";

// Admin only. Cancels an invoice, restores its stock once and keeps the record, flagged as void.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request, { role: "admin" });
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { id, reason } = await request.json();
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "A valid invoice id is required" }, { status: 400 });
    }

    await connectDB();
    const invoice = await voidInvoiceWithStock(
      String(id),
      String(user.userId || ""),
      typeof reason === "string" ? reason.trim() : ""
    );

    return NextResponse.json({ message: "Invoice voided", response: invoice }, { status: 200 });
  } catch (error) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Void invoice error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
