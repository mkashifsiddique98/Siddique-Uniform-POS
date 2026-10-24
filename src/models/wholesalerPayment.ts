// A payment WE make to a supplier (Wholesaler). Not related to customer invoices.
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWholesalerPayment extends Document {
  wholesalerId: Types.ObjectId;
  amount: number;
  date: Date;
  note: string;
  createdBy: string;
}

const wholesalerPaymentSchema: Schema<IWholesalerPayment> = new Schema(
  {
    wholesalerId: { type: Schema.Types.ObjectId, ref: "Wholesaler", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, default: "" },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true }
);

wholesalerPaymentSchema.index({ wholesalerId: 1, date: 1 });

const WholesalerPayment: Model<IWholesalerPayment> =
  mongoose.models.WholesalerPayment ||
  mongoose.model<IWholesalerPayment>("WholesalerPayment", wholesalerPaymentSchema);

export default WholesalerPayment;
