// models/invoice.ts

import mongoose, { Schema } from "mongoose";

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

invoiceSchema.index({ invoiceDate: -1, status: 1 });
invoiceSchema.index({ "customer.phone": 1, invoiceDate: -1 });
invoiceSchema.index({ "customer.customerName": 1, "customer.schoolName": 1, invoiceDate: -1 });

const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;
