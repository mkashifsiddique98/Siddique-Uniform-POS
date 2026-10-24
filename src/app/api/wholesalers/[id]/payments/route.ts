import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/utils/connectDB";
import Wholesaler from "@/models/wholesaler";
import WholesalerPayment from "@/models/wholesalerPayment";
import { requireAuth } from "@/lib/auth";
import { wholesalerPaymentSchema } from "@/validation/wholesalers";

connectDB();

// Payments WE make to a supplier (Wholesaler).
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
    const payments = await WholesalerPayment.find({ wholesalerId: params.id }).sort({ date: -1, _id: -1 }).lean();
    return NextResponse.json({
      payments: payments.map((payment) => ({
        id: String(payment._id),
        date: payment.date,
        amount: payment.amount,
        note: payment.note || "",
      })),
    });
  } catch (error) {
    console.error("Wholesaler payments error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request, { page: "purchase" });
  if (!auth.ok) return auth.response;
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid wholesaler ID" }, { status: 400 });
  }

  const parsed = wholesalerPaymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payment" }, { status: 400 });
  }
  const amount = Math.round(parsed.data.amount * 100) / 100;

  try {
    // Atomic guard: only reduce when enough is pending, so concurrent payments cannot overpay
    const updated = await Wholesaler.findOneAndUpdate(
      { _id: params.id, pendingBalance: { $gte: amount } },
      { $inc: { pendingBalance: -amount } },
      { new: true }
    );
    if (!updated) {
      const exists = await Wholesaler.exists({ _id: params.id });
      if (!exists) return NextResponse.json({ error: "Wholesaler not found" }, { status: 404 });
      return NextResponse.json({ error: "Payment is more than the pending balance" }, { status: 400 });
    }

    let payment;
    try {
      payment = await WholesalerPayment.create({
        wholesalerId: params.id,
        amount,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        note: parsed.data.note,
        createdBy: auth.user.userId || "",
      });
    } catch (saveError) {
      await Wholesaler.updateOne({ _id: params.id }, { $inc: { pendingBalance: amount } });
      throw saveError;
    }

    const pendingBalance = Math.round(Number(updated.pendingBalance) * 100) / 100;
    if (pendingBalance <= 0 && updated.paymentStatus !== "Clear") {
      await Wholesaler.updateOne({ _id: params.id }, { $set: { paymentStatus: "Clear" } });
    }

    return NextResponse.json(
      { payment: { id: String(payment._id), date: payment.date, amount: payment.amount, note: payment.note }, pendingBalance },
      { status: 201 }
    );
  } catch (error) {
    console.error("Wholesaler payment create error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
