import connectDB from "@/utils/connectDB";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getNextInvoicePreview } from "@/lib/invoiceService";

connectDB();

// Read-only preview of the next invoice number. It never writes: the real number is
// assigned by the server when the invoice is saved (POST /api/invoice).
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    await connectDB();
    const nextInvoiceNo = await getNextInvoicePreview();

    const response = NextResponse.json({ response: nextInvoiceNo }, { status: 200 });
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    return response;
  } catch (error) {
    console.error("Error fetching invoice", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
