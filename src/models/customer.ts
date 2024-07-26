import mongoose, { Schema, Document } from "mongoose";
import { customer } from "@/types/customer";

interface ICustomer extends Document, customer {}

const customerSchema: Schema = new Schema({
  customerName: { type: String, required: true },
  schoolName: { type: String },
  type: { type: String },
  phone: { type: Number },
  prevBalance: { type: Number, default: 0 },
});

const Customer =
  (mongoose.models.Customer as mongoose.Model<ICustomer>) ||
  mongoose.model<ICustomer>("Customer", customerSchema);

export default Customer;
