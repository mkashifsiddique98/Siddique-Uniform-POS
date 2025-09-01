import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUtilize extends Document {
  title: string;
  amount: number;
  category: Types.ObjectId; 
  paymentMethod: string;
  handledBy: string;
  note?: string;
  createdAt: Date;
}

const UtilizeSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category:{ type: Schema.Types.ObjectId},
    paymentMethod: { type: String, required: true },
    handledBy: { type: String, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Utilize ||
  mongoose.model<IUtilize>("Utilize", UtilizeSchema);
