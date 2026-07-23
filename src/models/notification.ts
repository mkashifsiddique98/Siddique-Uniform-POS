import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
  type: { type: String, required: true }, // 'low-stock' or 'due-date'
  message: { type: String, required: true },
  productId: { type: Schema.Types.ObjectId },
  invoiceId: { type: Schema.Types.ObjectId},
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

 const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;