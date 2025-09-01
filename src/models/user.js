// CommonJS version (in user.js)
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String },
  pages: { type: [String], default: [] },
  password: { type: String, required: true },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
