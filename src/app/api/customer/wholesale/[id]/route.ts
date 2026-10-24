import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { requireAuth } from "@/lib/auth";
import { buildCustomerInvoiceLedger, deriveReceivedPayments } from "@/lib/customerLedger";
import { toCustomerLedgerRecord, wholesaleCustomerInvoicesFilter } from "@/lib/customerData";

connectDB();

// Wholesale customer detail is built exclusively from invoices with the exact stored customer type.
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
  }

  try {
    const invoices = await Invoice.find(wholesaleCustomerInvoicesFilter(params.id))
      .select("_id invoiceNo productDetail grandTotal prevBalance invoiceDate status customer")
      .sort({ invoiceDate: 1, _id: 1 })
      .lean();
    if (invoices.length === 0) return NextResponse.json({ error: "Wholesale customer not found" }, { status: 404 });

    const records = invoices.map(toCustomerLedgerRecord);
    const ledger = buildCustomerInvoiceLedger(records, 0);
    const payments = deriveReceivedPayments(records);
    const statusById = new Map(invoices.map((invoice) => [String(invoice._id), invoice.status as string]));
    const customer = invoices[invoices.length - 1].customer;

    return NextResponse.json({
      profile: {
        id: String(customer?._id || params.id),
        name: customer?.customerName || "",
        schoolName: customer.schoolName || "",
        phone: customer?.phone ?? null,
        prevBalance: Number(customer?.prevBalance || 0),
      },
      totals: {
        sales: ledger.totals.sales,
        returns: ledger.totals.returns,
        netSales: ledger.totals.netSales,
        paymentsReceived: Math.round(payments.reduce((sum, payment) => sum + payment.amount, 0) * 100) / 100,
        prevBalance: Number(customer?.prevBalance || 0),
        invoiceCount: invoices.length,
      },
      invoices: ledger.rows
        .filter((row: { type: string }) => row.type === "sale")
        .map((row: { sourceId: string; date: string; reference: string; summary: string; debit: number }) => ({
          id: row.sourceId,
          date: row.date,
          invoiceNo: row.reference,
          summary: row.summary,
          total: row.debit,
          status: statusById.get(row.sourceId) || "",
          remainingBalance: records.find((record) => record.id === row.sourceId)?.prevBalance ?? 0,
        }))
        .reverse(),
      returns: ledger.rows
        .filter((row: { type: string }) => row.type === "return")
        .map((row: { sourceId: string; date: string; reference: string; summary: string; credit: number }) => ({
          id: row.sourceId,
          date: row.date,
          invoiceNo: row.reference,
          summary: row.summary,
          amount: row.credit,
        }))
        .reverse(),
      paymentsReceived: [...payments].reverse(),
      notes: ["Payments received are estimated from balance changes between invoices; invoices do not store the amount received."],
    });
  } catch (error) {
    console.error("Wholesale customer detail error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
