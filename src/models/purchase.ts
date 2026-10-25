// models/purchase.ts - stock bought FROM a supplier (Wholesaler)
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IWholesaler } from './wholesaler';

export interface Ipurchase extends Document {
  wholesalerId: Types.ObjectId;
  wholesaler: IWholesaler;
  paidAmount: number;
  products: [];
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
 
}
const wholesalerSchema: Schema<IWholesaler> = new Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    phone: { type: String, required: true },
    paymentStatus: { type: String, default: 'Clear' },
    pendingBalance: { type: Number, default: 0 },
  });
  const productSchema: Schema = new Schema({
    productName: { type: String, required: true },
    schoolName: { type: String },
    supplier: { type: String },
    category: { type: String, required: true },
    size: { type: String, required: true },
    sellPrice: { type: Number, required: true },
    productCost: { type: Number, required: true },
    wholesalePrice: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    stockAlert: { type: Number, default: 0 },
  });
const purchaseSchema: Schema<Ipurchase> = new Schema({
  // Authoritative link used by the ledger; `wholesaler` below is a snapshot copy
  wholesalerId: { type: Schema.Types.ObjectId, ref: 'Wholesaler', index: true },
  wholesaler: wholesalerSchema,
  products: [productSchema],
  isPaid: { type: Boolean, required: true },
  paidAmount: { type: Number, default: 0 },
},{ timestamps: true });

// Ledger by wholesaler over a date range, and date-range reports
purchaseSchema.index({ wholesalerId: 1, createdAt: 1 });
purchaseSchema.index({ createdAt: 1 });
purchaseSchema.index({ "wholesaler._id": 1 });

const purchase: Model<Ipurchase> = mongoose.models.purchase || mongoose.model<Ipurchase>('purchase', purchaseSchema);

export default purchase;
