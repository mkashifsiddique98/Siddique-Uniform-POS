import type { PipelineStage } from "mongoose";
import Invoice from "@/models/invoice";
import Product from "@/models/Product";
import Customer from "@/models/customer";
import Utilize from "@/models/utilize";
import { SHOP_TIME_ZONE } from "@/lib/formatTime";
import {
  compareValues,
  fillDailySeries,
  type Comparison,
  type DateWindow,
  type ResolvedRange,
} from "@/lib/dashboardRange";

export const DASHBOARD_SECTIONS = ["kpis", "trend", "schools", "products", "overdue", "reorder"] as const;
export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number];

// Cost, profit, stock value and expenses are admin-only. They are never queried for other roles, and this list
// is also used to strip them from any payload that is about to be sent to a non-admin.
export const ADMIN_ONLY_KEYS = [
  "cost",
  "productCost",
  "profit",
  "grossProfit",
  "stockValue",
  "stockRetailValue",
  "expenses",
  "net",
] as const;

const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

// ---------- pipeline builders (pure, unit tested) ----------

// Voided invoices never count towards sales. `to` is exclusive.
export function buildInvoiceMatch(window: DateWindow) {
  return { voided: { $ne: true }, invoiceDate: { $gte: window.from, $lt: window.to } };
}

// Credit given on an invoice = the unpaid part saved on it (invoice.prevBalance), never above the invoice total.
const creditExpr = { $min: [{ $max: [0, { $ifNull: ["$prevBalance", 0] }] }, { $max: [0, { $ifNull: ["$grandTotal", 0] }] }] };
const totalExpr = { $max: [0, { $ifNull: ["$grandTotal", 0] }] };

export function buildTotalsPipeline(window: DateWindow): PipelineStage[] {
  return [
    { $match: buildInvoiceMatch(window) },
    { $group: { _id: null, sales: { $sum: totalExpr }, credit: { $sum: creditExpr }, invoices: { $sum: 1 } } },
  ];
}

export function buildDailyPipeline(window: DateWindow): PipelineStage[] {
  return [
    { $match: buildInvoiceMatch(window) },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate", timezone: SHOP_TIME_ZONE } },
        sales: { $sum: totalExpr },
        invoices: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];
}

export function buildSchoolPipeline(window: DateWindow): PipelineStage[] {
  return [
    { $match: buildInvoiceMatch(window) },
    {
      $group: {
        _id: { $ifNull: ["$customer.schoolName", ""] },
        sales: { $sum: totalExpr },
        invoices: { $sum: 1 },
      },
    },
    { $sort: { sales: -1 } },
    { $limit: 15 },
  ];
}

// A line is a return when mode is "return" or it is an old separate return line (return:true, sold:false).
const isReturnLine = {
  $or: [
    { $eq: [{ $toLower: { $ifNull: ["$productDetail.mode", ""] } }, "return"] },
    { $and: [{ $eq: ["$productDetail.return", true] }, { $eq: ["$productDetail.sold", false] }] },
  ],
};
const lineQty = { $ifNull: ["$productDetail.quantity", 0] };
const linePrice = { $ifNull: ["$productDetail.sellPrice", 0] };
// Net sold quantity of a line: quantity minus its non-cancelled returns; old return lines count negative.
const returnedOnLine = {
  $reduce: {
    input: {
      $filter: {
        input: { $ifNull: ["$productDetail.returns", []] },
        as: "r",
        cond: { $ne: ["$$r.cancelled", true] },
      },
    },
    initialValue: 0,
    in: { $add: ["$$value", { $ifNull: ["$$r.qty", 0] }] },
  },
};
const netQtyExpr = { $cond: [isReturnLine, { $multiply: [-1, lineQty] }, { $subtract: [lineQty, returnedOnLine] }] };

export function buildProductSalesPipeline(window: DateWindow): PipelineStage[] {
  return [
    { $match: buildInvoiceMatch(window) },
    { $unwind: "$productDetail" },
    { $addFields: { netQty: netQtyExpr } },
    {
      $group: {
        _id: { $ifNull: ["$productDetail.productId", "$productDetail.productName"] },
        productId: { $first: "$productDetail.productId" },
        productName: { $first: "$productDetail.productName" },
        qty: { $sum: "$netQty" },
        revenue: { $sum: { $multiply: ["$netQty", linePrice] } },
      },
    },
  ];
}

// Admin only. Cost of goods sold at the product's current productCost; special items (no productId) count as 0.
export function buildCostPipeline(window: DateWindow, productCollection: string): PipelineStage[] {
  return [
    ...buildProductSalesPipeline(window),
    { $match: { productId: { $ne: null } } },
    { $lookup: { from: productCollection, localField: "productId", foreignField: "_id", as: "p" } },
    {
      $group: {
        _id: null,
        cost: { $sum: { $multiply: ["$qty", { $ifNull: [{ $arrayElemAt: ["$p.productCost", 0] }, 0] }] } },
      },
    },
  ];
}

// ---------- row mappers (pure) ----------

type TotalsRow = { sales?: number; credit?: number; invoices?: number } | undefined;

export function summarizeTotals(row: TotalsRow) {
  const sales = round2(row?.sales ?? 0);
  const credit = round2(row?.credit ?? 0);
  return { sales, credit, cash: round2(Math.max(0, sales - credit)), invoices: row?.invoices ?? 0 };
}

type ProductSalesRow = { _id: unknown; productId?: unknown; productName?: string; qty: number; revenue: number };

export function rankProducts(rows: ProductSalesRow[]) {
  const mapped = rows.map((row) => ({
    productId: row.productId ? String(row.productId) : null,
    productName: row.productName || "Unnamed item",
    qty: row.qty,
    revenue: round2(row.revenue),
  }));
  const top = mapped
    .filter((row) => row.qty > 0)
    .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
    .slice(0, 10);
  return { top, all: mapped };
}

type OverdueRow = {
  _id: unknown;
  invoiceNo: number;
  dueDate: Date;
  grandTotal?: number;
  outstanding: number;
  customerName?: string;
  schoolName?: string;
  customerId?: unknown;
  hasCustomer?: boolean;
  balance?: number;
};

// An invoice stays "Pending" even after the customer pays the balance later, so the customer's current balance
// caps the amount; a customer who owes nothing has nothing overdue.
export function resolveOverdue(rows: OverdueRow[], now: Date) {
  const items = rows
    .map((row) => {
      const known = row.hasCustomer === true;
      const outstanding = known ? Math.min(row.outstanding, Math.max(0, row.balance ?? 0)) : row.outstanding;
      return {
        invoiceNo: row.invoiceNo,
        customerName: row.customerName || "Walk-in",
        schoolName: row.schoolName || "",
        dueDate: row.dueDate,
        daysOverdue: Math.max(1, Math.floor((now.getTime() - new Date(row.dueDate).getTime()) / 86400000)),
        outstanding: round2(outstanding),
      };
    })
    .filter((row) => row.outstanding > 0);
  return {
    count: items.length,
    total: round2(items.reduce((sum, row) => sum + row.outstanding, 0)),
    items: items.slice(0, 10),
  };
}

// ---------- role guard ----------

export function stripAdminFields<T>(value: T, isAdmin: boolean): T {
  if (isAdmin) return value;
  const deny = new Set<string>(ADMIN_ONLY_KEYS);
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object" && !(node instanceof Date)) {
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(node)) {
        if (!deny.has(key)) out[key] = walk(child);
      }
      return out;
    }
    return node;
  };
  return walk(value) as T;
}

// ---------- queries ----------

async function totalsFor(window: DateWindow) {
  const [row] = await Invoice.aggregate(buildTotalsPipeline(window));
  return summarizeTotals(row);
}

async function costFor(window: DateWindow): Promise<number> {
  const [row] = await Invoice.aggregate(buildCostPipeline(window, Product.collection.name));
  return round2(row?.cost ?? 0);
}

async function expensesFor(window: DateWindow): Promise<number> {
  const [row] = await Utilize.aggregate([
    { $match: { createdAt: { $gte: window.from, $lt: window.to } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return round2(row?.total ?? 0);
}

async function lowStockCount(): Promise<number> {
  const [row] = await Product.aggregate([
    { $match: { $expr: { $lte: [{ $ifNull: ["$quantity", 0] }, { $ifNull: ["$stockAlert", 0] }] } } },
    { $count: "count" },
  ]);
  return row?.count ?? 0;
}

export async function getKpis(range: ResolvedRange, isAdmin: boolean) {
  const [current, previous, receivable, lowStock] = await Promise.all([
    totalsFor(range.current),
    totalsFor(range.previous),
    Customer.aggregate([
      { $match: { prevBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$prevBalance" }, customers: { $sum: 1 } } },
    ]),
    lowStockCount(),
  ]);

  const kpis: Record<string, unknown> = {
    sales: compareValues(current.sales, previous.sales),
    cashCollected: compareValues(current.cash, previous.cash),
    creditGiven: compareValues(current.credit, previous.credit),
    invoices: compareValues(current.invoices, previous.invoices),
    receivable: { total: round2(receivable[0]?.total ?? 0), customers: receivable[0]?.customers ?? 0 },
    lowStockCount: lowStock,
  };

  if (isAdmin) {
    const [expCur, expPrev, costCur, costPrev, stock] = await Promise.all([
      expensesFor(range.current),
      expensesFor(range.previous),
      costFor(range.current),
      costFor(range.previous),
      Product.aggregate([
        {
          $group: {
            _id: null,
            cost: { $sum: { $multiply: [{ $max: [0, { $ifNull: ["$quantity", 0] }] }, { $ifNull: ["$productCost", 0] }] } },
            retail: { $sum: { $multiply: [{ $max: [0, { $ifNull: ["$quantity", 0] }] }, { $ifNull: ["$sellPrice", 0] }] } },
          },
        },
      ]),
    ]);
    kpis.expenses = compareValues(expCur, expPrev);
    kpis.net = compareValues(current.cash - expCur, previous.cash - expPrev);
    kpis.profit = compareValues(current.sales - costCur, previous.sales - costPrev);
    kpis.cost = compareValues(costCur, costPrev);
    kpis.stockValue = { cost: round2(stock[0]?.cost ?? 0), retail: round2(stock[0]?.retail ?? 0) };
  }
  return kpis;
}

export async function getTrend(range: ResolvedRange) {
  const rows = await Invoice.aggregate(buildDailyPipeline(range.current));
  return fillDailySeries(
    rows.map((row) => ({ date: String(row._id), sales: row.sales, invoices: row.invoices })),
    range.current
  );
}

export async function getSchools(range: ResolvedRange) {
  const rows = await Invoice.aggregate(buildSchoolPipeline(range.current));
  return rows.map((row) => ({ school: row._id || "No school", sales: round2(row.sales), invoices: row.invoices }));
}

export async function getProducts(range: ResolvedRange) {
  const sold = rankProducts(await Invoice.aggregate(buildProductSalesPipeline(range.current)));

  // Slowest = products still in stock, fewest units sold in the period (never sold first, biggest stock first)
  const soldIds = sold.all.filter((row) => row.productId).map((row) => row.productId as string);
  const neverSold = await Product.aggregate([
    { $match: { quantity: { $gt: 0 }, isBundle: { $ne: true }, $expr: { $not: [{ $in: [{ $toString: "$_id" }, soldIds] }] } } },
    { $sort: { quantity: -1 } },
    { $limit: 10 },
    { $project: { productName: 1, size: 1, schoolName: 1, quantity: 1 } },
  ]);
  const slowest: { productId: string | null; productName: string; qty: number; stock: number }[] = neverSold.map((p) => ({
    productId: String(p._id),
    productName: [p.productName, p.size].filter(Boolean).join(" - "),
    qty: 0,
    stock: p.quantity,
  }));

  if (slowest.length < 10) {
    const lowestSold = sold.all
      .filter((row) => row.productId && row.qty >= 0)
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 50);
    const inStock = await Product.find({ _id: { $in: lowestSold.map((row) => row.productId) }, quantity: { $gt: 0 } })
      .select("quantity")
      .lean<{ _id: unknown; quantity: number }[]>();
    const stockById = new Map(inStock.map((p) => [String(p._id), p.quantity]));
    for (const row of lowestSold) {
      if (slowest.length >= 10) break;
      const stock = stockById.get(row.productId as string);
      if (stock) slowest.push({ productId: row.productId, productName: row.productName, qty: row.qty, stock });
    }
  }
  return { top: sold.top, slowest };
}

export async function getOverdue(now: Date = new Date()) {
  const rows = await Invoice.aggregate([
    { $match: { voided: { $ne: true }, status: "Pending", dueDate: { $lt: now }, prevBalance: { $gt: 0 } } },
    { $sort: { dueDate: 1 } },
    { $limit: 200 },
    { $lookup: { from: Customer.collection.name, localField: "customer._id", foreignField: "_id", as: "c" } },
    {
      $project: {
        invoiceNo: 1,
        dueDate: 1,
        grandTotal: 1,
        outstanding: "$prevBalance",
        customerName: "$customer.customerName",
        schoolName: "$customer.schoolName",
        hasCustomer: { $gt: [{ $size: "$c" }, 0] },
        balance: { $arrayElemAt: ["$c.prevBalance", 0] },
      },
    },
  ]);
  return resolveOverdue(rows, now);
}

export async function getReorder() {
  const [facet] = await Product.aggregate([
    { $match: { $expr: { $lte: [{ $ifNull: ["$quantity", 0] }, { $ifNull: ["$stockAlert", 0] }] } } },
    {
      $facet: {
        count: [{ $count: "n" }],
        suppliers: [
          { $sort: { quantity: 1 } },
          {
            $group: {
              _id: { $ifNull: ["$supplier", ""] },
              total: { $sum: 1 },
              items: {
                $push: {
                  productId: "$_id",
                  productName: "$productName",
                  size: "$size",
                  schoolName: "$schoolName",
                  quantity: { $max: [0, { $ifNull: ["$quantity", 0] }] },
                  stockAlert: { $ifNull: ["$stockAlert", 0] },
                },
              },
            },
          },
          { $project: { total: 1, items: { $slice: ["$items", 8] } } },
          { $sort: { total: -1 } },
          { $limit: 20 },
        ],
      },
    },
  ]);
  return {
    count: facet?.count?.[0]?.n ?? 0,
    suppliers: (facet?.suppliers ?? []).map(
      (s: { _id: string; total: number; items: Record<string, unknown>[] }) => ({
        supplier: s._id || "No supplier",
        total: s.total,
        items: s.items.map((item) => ({ ...item, productId: String(item.productId) })),
      })
    ),
  };
}

export async function getDashboardSection(section: DashboardSection, range: ResolvedRange, isAdmin: boolean, now = new Date()) {
  switch (section) {
    case "kpis":
      return getKpis(range, isAdmin);
    case "trend":
      return getTrend(range);
    case "schools":
      return getSchools(range);
    case "products":
      return getProducts(range);
    case "overdue":
      return getOverdue(now);
    case "reorder":
      return getReorder();
  }
}

export type { Comparison };
