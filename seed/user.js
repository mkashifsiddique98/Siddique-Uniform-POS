// seed/adminSeed.js

const mongoose = require("mongoose");
const User = require("../src/models/user");
const Template = require("../src/models/receipt-template");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mypos";

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");
    
    const existingAdmin = await User.findOne({ email: "admin@pos.com" });

    if (existingAdmin) {
      console.log("Admin user already exists.");
      return;
    }

    const adminUser = new User({
      name: "admin",
      email: "admin@pos.com",
      password: "123456", // You should hash this for production!
      role: "admin",
      pages: [
        "customer",
        "pos",
        "user",
        "purchase",
        "user/profile",
        "dashboard",
        "utilize",
        "product",
        "invoice",
        "setting",
        "/",
      ],
    });
    const SaveTemplate = new Template({
      shopName:"صدیق یونیفارم سنٹر",
      shopTagline:"بہترین معیار، مناسب قیمت",
      shopAddress:"پتہ:سراں مارکیٹ کریانوالہ",
      shopPhone:"03086139401:فون نمبر",
      messageCustomer:"نوٹ: خریدا ہوا سامان بل کے بغیر واپس یا تبدیل نہیں ہوگا۔",
      socialMedia:{
        facebook: "facebook url",
        tiktok:"tiktok url"
      }

    })
    await adminUser.save();
    await SaveTemplate.save()
    console.log("✅ Seeded successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB");
  }
}

seedAdmin();
