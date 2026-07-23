// models/invoice.ts

import mongoose, { Schema } from "mongoose";

const ProductSchema: Schema = new Schema({
  productName: { type: String },
  quantity: { type: Number },
  sellPrice: { type: Number },
  return: { type: Boolean, default: false },
  sold: { type: Boolean, default: false }
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
  invoiceNo: { type: Number, unique: true, require: true, },
  customer: customerSchema, // ref to "Customer"
  productDetail: [ProductSchema],
  prevBalance: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  anyMessage: { type: String },
  invoiceDate: { type: Date },
  dueDate: { type: Date },
  discount: { type: Number, default: 0 },
  status: { type: String, default: "Clear" },
});

const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
