import mongoose, {  Schema } from "mongoose";
import { ProductFormState } from "@/types/product";

interface IProduct extends ProductFormState {}

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

const Product =
  (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>("Product", productSchema);

export default Product;
