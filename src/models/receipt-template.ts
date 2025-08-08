import mongoose, { Schema, Document } from "mongoose";

interface SocialMedia {
  facebook: string;
  tiktok: string;
}

export interface IReceiptTemplate extends Document {
  shopName: string;
  shopTagline: string;
  shopAddress: string;
  shopPhone: string;
  messageCustomer: string;
  socialMedia: SocialMedia;
}

const SocialMediaSchema: Schema = new Schema({
  facebook: { type: String, default: "" },
  tiktok: { type: String, default: "" },
});

const ReceiptTemplateSchema: Schema = new Schema({
  shopName: { type: String, required: true },
  shopTagline: { type: String, required: true },
  shopAddress: { type: String, required: true },
  shopPhone: { type: String, required: true },
  messageCustomer: { type: String, required: true },
  socialMedia: { type: SocialMediaSchema, required: true },
});

const ReceiptTemplate =
  mongoose.models.ReceiptTemplate ||
  mongoose.model<IReceiptTemplate>("ReceiptTemplate", ReceiptTemplateSchema);

export default ReceiptTemplate;
