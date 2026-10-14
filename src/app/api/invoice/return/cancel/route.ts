import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/connectDB";
import { requireAuth } from "@/lib/auth";
import { InvoiceError, cancelReturnOnInvoice } from "@/lib/invoiceService";
import { normalizeInvoiceForRead } from "@/lib/posHelpers";

// Cancels one return of an invoice. The entry stays on the invoice (struck through) for audit,
// returnedQty is recalculated and the stock difference is applied in the same transaction.
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { id, lineIndex, returnIndex } = await request.json();
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "A valid invoice id is required" }, { status: 400 });
    }
    if (!Number.isInteger(lineIndex) || !Number.isInteger(returnIndex) || lineIndex < 0 || returnIndex < 0) {
      return NextResponse.json({ error: "lineIndex and returnIndex are required" }, { status: 400 });
    }

    await connectDB();
    const { invoice } = await cancelReturnOnInvoice(String(id), lineIndex, returnIndex, String(user.userId || ""));

    return NextResponse.json({ message: "Return cancelled", response: normalizeInvoiceForRead(invoice) }, { status: 200 });
  } catch (error) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Cancel return error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
