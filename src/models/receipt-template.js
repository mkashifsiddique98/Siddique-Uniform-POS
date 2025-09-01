const mongoose = require("mongoose");

const SocialMediaSchema = new mongoose.Schema({
  facebook: { type: String, default: "" },
  tiktok: { type: String, default: "" },
});

const ReceiptTemplateSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  shopTagline: { type: String, required: true },
  shopAddress: { type: String, required: true },
  shopPhone: { type: String, required: true },
  messageCustomer: { type: String, required: true },
  socialMedia: { type: SocialMediaSchema, required: true },
});

const ReceiptTemplate =
  mongoose.models.ReceiptTemplate ||
  mongoose.model("ReceiptTemplate", ReceiptTemplateSchema);

module.exports = ReceiptTemplate;
