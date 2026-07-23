// utils/checkNotifications.ts
import Invoice from "@/models/invoice";
import Product from "@/models/Product";
import Notification from "@/models/notification";
import connectDB from "./connectDB";
import { startOfDay, endOfDay, addDays, format, isBefore } from "date-fns";


export async function checkNotifications() {
  await connectDB();

  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfTwoDaysFromNow = endOfDay(addDays(today, 2));

  // --------------------
  // 1. LOW STOCK CHECK
  // --------------------
  const lowStockProducts = await Product.find({ quantity: { $lte: 5 } });

  for (const product of lowStockProducts) {
    const existing = await Notification.findOne({
      type: "low-stock",
      productId: product._id,
    });

    if (!existing) {
      await Notification.create({
        type: "low-stock",
        message: `${product.productName} is low in stock (${product.quantity})`,
        productId: product._id,
      });
    }
  }

  // --------------------
  // 2. INVOICE CHECKS
  // --------------------
  const invoices = await Invoice.find({status: "Pending" }); // Only non-delivered
   console.log("invoices",invoices)
  for (const invoice of invoices) {
    const dueDateStr = format(invoice.dueDate, "dd MMM yyyy");
    const existing = await Notification.findOne({
        type:"due-date",
        invoiceId: invoice._id,
      });

      if (!existing) {
        await Notification.create({
          type:"due-date",
          message:`${invoice.customer.customerName}-(${invoice.customer.type}), Order is due date at ${dueDateStr}`,
          invoiceId: invoice._id,
        });
      }
    }
  }

