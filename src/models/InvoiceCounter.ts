import mongoose, { Schema } from "mongoose";

const invoiceCounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const InvoiceCounter =
  mongoose.models.InvoiceCounter || mongoose.model("InvoiceCounter", invoiceCounterSchema);

export default InvoiceCounter;
