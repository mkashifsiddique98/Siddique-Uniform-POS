import mongoose, { Schema, Document } from "mongoose";
<<<<<<< HEAD


interface ICustomer extends Document {
  customerName: string;
  schoolName?: string;
  type?: string;
  phone?: number;
  prevBalance?: number;
}
=======
import { customer } from "@/types/customer";


interface ICustomer extends Document, customer {}
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

const customerSchema: Schema = new Schema({
  customerName: { type: String, required: true },
  schoolName: { type: String },
  type: { type: String },
  phone: { type: Number },
  prevBalance: { type: Number, default: 0 },

});

<<<<<<< HEAD
customerSchema.index({ phone: 1 });
customerSchema.index({ customerName: 1, schoolName: 1 });

=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
const Customer =
  (mongoose.models.Customer as mongoose.Model<ICustomer>) ||
  mongoose.model<ICustomer>("Customer", customerSchema);

export default Customer;
