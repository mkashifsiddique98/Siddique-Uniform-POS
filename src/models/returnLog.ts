import mongoose, { Schema } from "mongoose";

// Audit trail of returns. Entries are written in the same transaction as the stock change.
// quantity/refundAmount are signed: a cancelled return or a deleted invoice writes a negative reversal entry.
const returnLogSchema = new Schema({
  invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
  invoiceNo: { type: Number },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String },
  quantity: { type: Number, required: true },
  refundAmount: { type: Number, required: true },
  reason: { type: String, default: "" },
  user: { type: String, default: "" },
  date: { type: Date, default: Date.now },
});

const ReturnLog = mongoose.models.ReturnLog || mongoose.model("ReturnLog", returnLogSchema);

export default ReturnLog;
