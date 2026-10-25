import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import Purchase from "@/models/purchase";

export interface DateRange {
  from?: Date;
  to?: Date;
}

// Same formulas as the original page.tsx JS code (voided invoices included,
// revenue gross, server-local calendar months), computed inside MongoDB.

const inRange = (field: string, start: Date, end: Date) => ({
  [field]: { $gte: start, $lte: end },
});

function monthBounds(year: number, month: number) {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59, 999),
  };
}

function monthsToCompare(now: Date) {
  const m = now.getMonth();
  const y = now.getFullYear();
  const cur = monthBounds(y, m);
  const prev = m === 0 ? monthBounds(y - 1, 11) : monthBounds(y, m - 1);
  return { cur, prev };
}

const pct = (current: number, previous: number) =>
  previous > 0 ? ((current - previous) / previous) * 100 : 0;

export function salesRanges(dateRange?: DateRange, now = new Date()) {
  const startDate = dateRange?.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = dateRange?.to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const duration = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);
  return { startDate, endDate, prevStart, prevEnd };
}

const sumRevenue = {
  $sum: {
    $reduce: {
      input: { $ifNull: ["$productDetail", []] },
      initialValue: 0,
      in: {
        $add: [
          "$$value",
          { $multiply: [{ $ifNull: ["$$this.sellPrice", 0] }, { $ifNull: ["$$this.quantity", 0] }] },
        ],
      },
    },
  },
};

export async function getDashboardKpis(dateRange?: DateRange, now = new Date()) {
  await connectDB();
  const { startDate, endDate, prevStart, prevEnd } = salesRanges(dateRange, now);
  const { cur, prev } = monthsToCompare(now);

  const [invoiceFacets, purchaseFacets] = await Promise.all([
    Invoice.aggregate([
      {
        $facet: {
          sales: [
            { $match: inRange("invoiceDate", startDate, endDate) },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } },
          ],
          prevSales: [
            { $match: inRange("invoiceDate", prevStart, prevEnd) },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } },
          ],
          revenue: [
            { $match: inRange("invoiceDate", cur.start, cur.end) },
            { $group: { _id: null, total: sumRevenue } },
          ],
          prevRevenue: [
            { $match: inRange("invoiceDate", prev.start, prev.end) },
            { $group: { _id: null, total: sumRevenue } },
          ],
          receivables: [
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $max: [
                      0,
                      {
                        $subtract: [
                          { $ifNull: ["$grandTotal", 0] },
                          { $ifNull: ["$paidAmount", 0] },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]),
    Purchase.aggregate([
      {
        $facet: {
          cur: [
            { $match: inRange("createdAt", cur.start, cur.end) },
            { $group: { _id: null, total: purchaseSum() } },
          ],
          prev: [
            { $match: inRange("createdAt", prev.start, prev.end) },
            { $group: { _id: null, total: purchaseSum() } },
          ],
        },
      },
    ]),
  ]);

  const first = (arr: any[]) => (arr?.[0]?.total as number) || 0;
  const inv = invoiceFacets[0];
  const pur = purchaseFacets[0];

  const currentMonthSales = first(inv.sales);
  const previousMonthSales = first(inv.prevSales);
  const totalCurrentMonthRevenue = first(inv.revenue);
  const prevRevenue = first(inv.prevRevenue);
  const totalCurrentMonth = first(pur.cur);
  const totalPreviousMonth = first(pur.prev);

  return {
    currentMonthSales,
    percentageChange: pct(currentMonthSales, previousMonthSales),
    totalCurrentMonthRevenue,
    percentageChangeRevenue: pct(totalCurrentMonthRevenue, prevRevenue),
    totalCurrentMonth,
    percentageChangePurchase: pct(totalCurrentMonth, totalPreviousMonth),
    totalReceivables: first(inv.receivables),
  };
}

function purchaseSum() {
  return {
    $sum: {
      $reduce: {
        input: { $ifNull: ["$products", []] },
        initialValue: 0,
        in: {
          $add: [
            "$$value",
            {
              $multiply: [
                { $ifNull: ["$$this.productCost", 0] },
                // mirrors `quantity || 1`
                { $cond: [{ $in: [{ $ifNull: ["$$this.quantity", 0] }, [0]] }, 1, "$$this.quantity"] },
              ],
            },
          ],
        },
      },
    },
  };
}
