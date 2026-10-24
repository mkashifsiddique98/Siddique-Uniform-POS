import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/utils/connectDB";
import Wholesaler from "@/models/wholesaler";
import Purchase from "@/models/purchase";
import WholesalerPayment from "@/models/wholesalerPayment";
import { requireAuth } from "@/lib/auth";
import { wholesalerHistoryQuerySchema } from "@/validation/wholesalers";
import { buildSupplierLedger } from "@/lib/wholesalerLedger";
import { toSupplierLedgerInput, purchasesOfWholesaler, PurchaseRecord } from "@/lib/wholesalerData";

connectDB();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid wholesaler ID" }, { status: 400 });
  }

  const parsedQuery = wholesalerHistoryQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json({ error: parsedQuery.error.issues[0]?.message || "Invalid query" }, { status: 400 });
  }

  try {
    const wholesaler = await Wholesaler.findById(params.id).lean();
    if (!wholesaler) return NextResponse.json({ error: "Wholesaler not found" }, { status: 404 });

    const { from, to, type, page, limit } = parsedQuery.data;
    const purchaseQuery: Record<string, unknown> = purchasesOfWholesaler(params.id);
    if (to) purchaseQuery.createdAt = { $lte: new Date(to) };
    const paymentQuery: Record<string, unknown> = { wholesalerId: params.id };
    if (to) paymentQuery.date = { $lte: new Date(to) };
    const [purchases, payments] = await Promise.all([
      Purchase.find(purchaseQuery).sort({ createdAt: 1, _id: 1 }).lean() as unknown as Promise<PurchaseRecord[]>,
      WholesalerPayment.find(paymentQuery).sort({ date: 1, _id: 1 }).lean(),
    ]);

    const fullLedger = buildSupplierLedger(
      purchases.map(toSupplierLedgerInput),
      0,
      payments.map((payment) => ({ id: String(payment._id), date: payment.date, amount: payment.amount, note: payment.note }))
    );
    const filteredRows = fullLedger.rows.filter((row) => {
      const timestamp = new Date(row.date).getTime();
      const afterFrom = !from || timestamp >= new Date(from).getTime();
      const beforeTo = !to || timestamp <= new Date(to).getTime();
      const matchesType = type === "all" || row.type === type;
      return afterFrom && beforeTo && matchesType;
    });
    const start = (page - 1) * limit;
    const rows = filteredRows.slice(start, start + limit);
    const firstRow = rows[0];
    const firstFullLedgerIndex = firstRow
      ? fullLedger.rows.findIndex((row) => row.sourceId === firstRow.sourceId && row.type === firstRow.type && row.date === firstRow.date)
      : -1;
    const previousRow = firstFullLedgerIndex > 0 ? fullLedger.rows[firstFullLedgerIndex - 1] : undefined;

    return NextResponse.json({
      rows,
      totals: fullLedger.totals,
      openingBalance: previousRow?.balance ?? 0,
      pagination: { page, limit, total: filteredRows.length, pages: Math.ceil(filteredRows.length / limit) },
      dataGaps: ["Ledger is built from purchases and payments to this supplier only"],
    });
  } catch (error) {
    console.error("Wholesaler history error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
