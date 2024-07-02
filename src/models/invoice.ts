import mongoose, { Schema } from "mongoose";
import { invoice } from "@/types/invoice";
const Product: Schema = new Schema({
  productName: { type: String },
  quantity: { type: Number },
  sellPrice: { type: Number },
});
const customerSchema: Schema = new Schema({
  invoiceNo: { type: Number },
  customer: { type: Schema.Types.ObjectId, ref: "Customer" },
  productDetail: [Product],
  prevBalance: { type: Number, default: 0 },
  grandTotal: {type: Number, default: 0},
  anyMessage: { type: String },
  invoiceDate: { type: Date },
});

const Invoice =
  (mongoose.models.Invoice as mongoose.Model<invoice>) ||
  mongoose.model<invoice>("Invoice", customerSchema);

export default Invoice;
