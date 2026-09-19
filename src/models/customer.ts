import mongoose, { Schema, Document } from "mongoose";


interface ICustomer extends Document {
  customerName: string;
  schoolName?: string;
  type?: string;
  phone?: number;
  prevBalance?: number;
}

const customerSchema: Schema = new Schema({
  customerName: { type: String, required: true },
  schoolName: { type: String },
  type: { type: String },
  phone: { type: Number },
  prevBalance: { type: Number, default: 0 },

});

customerSchema.index({ phone: 1 });
customerSchema.index({ customerName: 1, schoolName: 1 });

const Customer =
  (mongoose.models.Customer as mongoose.Model<ICustomer>) ||
  mongoose.model<ICustomer>("Customer", customerSchema);

export default Customer;
