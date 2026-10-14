import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/utils/connectDB";
import { requireAuth } from "@/lib/auth";
import { InvoiceError, addReturnsToInvoice } from "@/lib/invoiceService";

// Response shape: { success, message } on success, { success: false, error } on failure.
// This is only a thin wrapper: it goes through the same service as POST /api/invoice (one transaction),
// so it cannot disagree with it. The app itself saves returns through POST /api/invoice.
export async function PUT(request: Request) {
  try {
    await connectDB();

    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { invoiceId, products } = await request.json();

    if (!invoiceId || !mongoose.isValidObjectId(invoiceId)) {
      return NextResponse.json({ success: false, error: "A valid invoiceId is required." }, { status: 400 });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, error: "Products must be a non-empty array." }, { status: 400 });
    }

    const returns: { productId: string; quantity: number; reason?: string }[] = [];
    for (const item of products) {
      const quantity = Number(item?.quantity);
      if (!item?.productId || !mongoose.isValidObjectId(item.productId)) {
        return NextResponse.json({ success: false, error: "Invalid product ID." }, { status: 400 });
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json({ success: false, error: "Invalid return quantity." }, { status: 400 });
      }
      returns.push({
        productId: String(item.productId),
        quantity,
        reason: typeof item.reason === "string" ? item.reason.trim() : undefined,
      });
    }

    await addReturnsToInvoice(String(invoiceId), returns, String(user.userId || ""));

    return NextResponse.json(
      { success: true, message: "Return recorded and stock updated." },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    console.error("Product Return API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 500 }
    );
  }
}