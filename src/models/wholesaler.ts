// models/wholesaler.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWholesaler extends Document {
  name: string;
  location: string;
  phone: string;
  paymentStatus: string;
  pendingBalance: number;
}

const wholesalerSchema: Schema<IWholesaler> = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  phone: { type: String, required: true },
  paymentStatus: { type: String, default: 'Clear' },
  pendingBalance: { type: Number, default: 0 },
});

const Wholesaler: Model<IWholesaler> = mongoose.models.Wholesaler || mongoose.model<IWholesaler>('Wholesaler', wholesalerSchema);

export default Wholesaler;
