import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/utils/connectDB";
import Wholesaler from "@/models/wholesaler";
import Purchase from "@/models/purchase";
import WholesalerPayment from "@/models/wholesalerPayment";
import { requireAuth } from "@/lib/auth";
import { buildSupplierLedger, purchaseTotal } from "@/lib/wholesalerLedger";
import { toSupplierLedgerInput, purchasesOfWholesaler, PurchaseRecord } from "@/lib/wholesalerData";

connectDB();

// Supplier (Wholesaler) detail: contact, purchases, payments we made, totals. No invoice/sale data.
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid wholesaler ID" }, { status: 400 });
  }

  try {
    const wholesaler = await Wholesaler.findById(params.id).lean();
    if (!wholesaler) return NextResponse.json({ error: "Wholesaler not found" }, { status: 404 });

    const [purchases, payments] = await Promise.all([
      Purchase.find(purchasesOfWholesaler(params.id)).sort({ createdAt: -1, _id: -1 }).lean() as unknown as Promise<PurchaseRecord[]>,
      WholesalerPayment.find({ wholesalerId: params.id }).sort({ date: -1, _id: -1 }).lean(),
    ]);

    const ledger = buildSupplierLedger(
      [...purchases].reverse().map(toSupplierLedgerInput),
      0,
      payments.map((payment) => ({ id: String(payment._id), date: payment.date, amount: payment.amount, note: payment.note }))
    );

    const purchaseRows = purchases.map((purchase) => {
      const input = toSupplierLedgerInput(purchase);
      const total = purchaseTotal(input);
      return {
        id: input.id,
        date: input.date,
        isPaid: input.isPaid,
        paidAtPurchase: input.isPaid ? total : Math.min(total, input.paidAmount),
        total,
        products: input.products.map((product) => ({
          productName: product.productName || "Archived product",
          quantity: Number(product.quantity || 0),
          cost: Number(product.productCost || 0),
          lineTotal: Math.round(Number(product.productCost || 0) * Number(product.quantity || 0) * 100) / 100,
        })),
      };
    });

    return NextResponse.json({
      profile: {
        id: String(wholesaler._id),
        name: wholesaler.name,
        phone: wholesaler.phone,
        location: wholesaler.location,
        paymentStatus: wholesaler.paymentStatus,
        pendingBalance: Number(wholesaler.pendingBalance || 0),
      },
      totals: {
        purchased: ledger.totals.purchased,
        paid: ledger.totals.paid,
        paymentsMade: Math.round(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) * 100) / 100,
        pendingBalance: Number(wholesaler.pendingBalance || 0),
        purchaseCount: purchases.length,
      },
      purchases: purchaseRows,
      payments: payments.map((payment) => ({
        id: String(payment._id),
        date: payment.date,
        amount: payment.amount,
        note: payment.note || "",
      })),
    });
  } catch (error) {
    console.error("Wholesaler detail error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
