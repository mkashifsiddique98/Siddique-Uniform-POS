import mongoose, { Schema } from "mongoose";

// Single shop-wide settings document with _id "pos"
const settingSchema: Schema = new Schema({
  _id: { type: String },
  // "clamp": sales may go beyond stock, stock stops at 0. "block": a sale above stock is rejected (409).
  oversellMode: { type: String, enum: ["clamp", "block"], default: "clamp" },
});

const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);

export default Setting;
