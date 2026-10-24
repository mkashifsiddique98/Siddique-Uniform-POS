// utils/checkNotifications.ts
import Invoice from "@/models/invoice";
import Product from "@/models/Product";
import Notification from "@/models/notification";
import connectDB from "./connectDB";
import { format } from "date-fns";

const SCAN_TTL_MS = 60_000;

const g = global as any;
const state: { lastRun: number; inflight: Promise<void> | null } =
  g.__notificationScan ?? (g.__notificationScan = { lastRun: 0, inflight: null });

// Forces the next checkNotifications() call to rescan (call after stock/invoice changes).
export function invalidateNotificationScan() {
  state.lastRun = 0;
}

// Runs the scan at most once per minute; concurrent callers share the same run.
export async function checkNotifications() {
  if (Date.now() - state.lastRun < SCAN_TTL_MS) return;
  if (!state.inflight) {
    state.inflight = scan()
      .then(() => {
        state.lastRun = Date.now();
      })
      .finally(() => {
        state.inflight = null;
      });
  }
  await state.inflight;
}

async function scan() {
  await connectDB();

  // 1. Low stock: one query for products, one for existing notifications
  const lowStockProducts = await Product.find({ quantity: { $lte: 5 } }).select("_id productName quantity").lean();
  if (lowStockProducts.length) {
    const existing = await Notification.find({
      type: "low-stock",
      productId: { $in: lowStockProducts.map((p: any) => p._id) },
    }).select("productId").lean();
    const seen = new Set(existing.map((n: any) => String(n.productId)));
    const fresh = lowStockProducts
      .filter((p: any) => !seen.has(String(p._id)))
      .map((p: any) => ({
        type: "low-stock",
        message: `${p.productName} is low in stock (${p.quantity})`,
        productId: p._id,
      }));
    if (fresh.length) await Notification.insertMany(fresh);
  }

  // 2. Pending invoices (not delivered)
  const invoices = await Invoice.find({ status: "Pending" }).select("_id dueDate customer").lean();
  if (invoices.length) {
    const existing = await Notification.find({
      type: "due-date",
      invoiceId: { $in: invoices.map((i: any) => i._id) },
    }).select("invoiceId").lean();
    const seen = new Set(existing.map((n: any) => String(n.invoiceId)));
    const fresh = invoices
      .filter((i: any) => !seen.has(String(i._id)))
      .map((i: any) => ({
        type: "due-date",
        message: `${i.customer.customerName}-(${i.customer.type}), Order is due date at ${format(i.dueDate, "dd MMM yyyy")}`,
        invoiceId: i._id,
      }));
    if (fresh.length) await Notification.insertMany(fresh);
  }
}
