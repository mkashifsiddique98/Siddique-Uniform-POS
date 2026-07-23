// models/wholesaler.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { IWholesaler } from './wholesaler';

export interface Ipurchase extends Document {
  wholesaler: IWholesaler;
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
  wholesaler: wholesalerSchema,
  products: [productSchema],
  isPaid: { type: Boolean, required: true },
  
},{ timestamps: true });

const purchase: Model<Ipurchase> = mongoose.models.purchase || mongoose.model<Ipurchase>('purchase', purchaseSchema);

export default purchase;
