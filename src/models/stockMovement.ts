import mongoose, { Schema } from "mongoose";

// Written in the same transaction as the invoice whenever a sale could not be fully taken from stock
const stockMovementSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String },
  type: { type: String, default: "sold_beyond_stock" },
  invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
  invoiceNo: { type: Number },
  requested: { type: Number, default: 0 },
  deducted: { type: Number, default: 0 },
  unstocked: { type: Number, default: 0 },
  user: { type: String, default: "" },
  date: { type: Date, default: Date.now },
});

stockMovementSchema.index({ productId: 1, date: -1 });

const StockMovement = mongoose.models.StockMovement || mongoose.model("StockMovement", stockMovementSchema);

export default StockMovement;
