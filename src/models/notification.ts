import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
  type: { type: String, required: true }, // 'low-stock' or 'due-date'
  message: { type: String, required: true },
  productId: { type: Schema.Types.ObjectId },
  invoiceId: { type: Schema.Types.ObjectId},
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

notificationSchema.index({ read: 1, type: 1, createdAt: -1 });

 const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;