import mongoose, {  Schema } from "mongoose";
import { ProductFormState } from "@/types/product";

interface IProduct extends ProductFormState {}

const productSchema: Schema = new Schema({
 
  productName: { type: String, required: true },
  productCode:{ type: Number, default: 0},
  schoolName: { type: String },
  supplier: { type: String },
  category: { type: String, required: true },
  size: { type: String, required: true },
  sellPrice: { type: Number, required: true },
  productCost: { type: Number, required: true },
  wholesalePrice: { type: Number, required: true },
<<<<<<< HEAD
  quantity: { type: Number, default: 0, min: [0, "Stock cannot be negative"] },
  // Optional override of the shop-wide oversellMode setting
  oversellMode: { type: String, enum: ["clamp", "block"] },
=======
  quantity: { type: Number, default: 0 },
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  stockAlert: { type: Number, default: 0 },
  // 
  isBundle: { type: Boolean, default: false }, // full suit?
  components: [{ type: Schema.Types.ObjectId, ref: 'Product' }], 
  parentProduct: { type: Schema.Types.ObjectId, ref: 'Product' },
   images: [{ type: String }],
});

<<<<<<< HEAD
productSchema.index({ productCode: 1 });
productSchema.index({ schoolName: 1, category: 1 });

=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
const Product =
  (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>("Product", productSchema);

export default Product;
