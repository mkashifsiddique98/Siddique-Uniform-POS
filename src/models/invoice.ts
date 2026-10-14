// models/invoice.ts

import mongoose, { Schema } from "mongoose";

// One return of a sale line. `at` is always set by the server. Cancelled entries stay for audit.
const ReturnEntrySchema: Schema = new Schema({
  qty: { type: Number, required: true, min: 1 },
  at: { type: Date },
  reason: { type: String, default: "" },
  user: { type: String, default: "" },
  refundAmount: { type: Number, default: 0 },
  cancelled: { type: Boolean, default: false },
  cancelledAt: { type: Date },
  cancelledBy: { type: String },
}, { _id: true });

const ProductSchema: Schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: false,
  },
  productName: { type: String },
  quantity: { type: Number },
  sellPrice: { type: Number },
  return: { type: Boolean, default: false },
  sold: { type: Boolean, default: false },
  // No default: old return lines have no mode, and a default of "sale" hid them as sales when read
  mode: { type: String, enum: ["sale", "return"] },
  // For sale lines: always computed by the server as the sum of non-cancelled returns[].qty
  returnedQty: { type: Number, default: 0, min: 0 },
  returns: { type: [ReturnEntrySchema], default: [] },
  returnReason: { type: String },
  // Server-only. Units really taken from stock for this line (the rest was sold beyond stock).
  // Missing on legacy lines, which count as fully deducted. No default on purpose.
  stockDeducted: { type: Number, min: 0 },
  unstockedQty: { type: Number, min: 0 },
  // Per stock product (the product itself, or each component of a bundle) units deducted
  stockDeductions: {
    type: [new Schema({ productId: { type: Schema.Types.ObjectId }, qty: { type: Number, min: 0 } }, { _id: false })],
    default: undefined,
  },
}, {
  _id: true,
});
// use this method becuase populate is not working
const customerSchema: Schema = new Schema({
  customerName: { type: String, required: true },
  schoolName: { type: String },
  type: { type: String },
  phone: { type: Number },
  prevBalance: { type: Number, default: 0 },
});
const invoiceSchema: Schema = new Schema({
  invoiceNo: { type: Number, unique: true, required: true },
  // Sparse unique: only invoices saved with a client attempt key are indexed
  idempotencyKey: { type: String, unique: true, sparse: true },
  customer: customerSchema, // ref to "Customer"
  productDetail: [ProductSchema],
  prevBalance: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  anyMessage: { type: String },
  invoiceDate: { type: Date },
  dueDate: { type: Date },
  discount: { type: Number, default: 0 },
  status: { type: String, default: "Clear" },
  // Return state, recalculated on every save. Missing on legacy invoices, which count as "active".
  returnStatus: { type: String, enum: ["active", "partially_returned", "fully_returned"], default: "active" },
  voided: { type: Boolean, default: false },
  voidedAt: { type: Date },
  voidedBy: { type: String },
  voidReason: { type: String },
});

invoiceSchema.index({ invoiceDate: -1, status: 1 });
invoiceSchema.index({ "customer.phone": 1, invoiceDate: -1 });
// Dashboard: overdue list and per-customer lookups
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ "customer._id": 1, invoiceDate: -1 });
invoiceSchema.index({ "customer.customerName": 1, "customer.schoolName": 1, invoiceDate: -1 });

const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
