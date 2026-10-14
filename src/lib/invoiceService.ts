import mongoose, { ClientSession } from "mongoose";
import Invoice from "@/models/invoice";
import InvoiceCounter from "@/models/InvoiceCounter";
import Customer from "@/models/customer";
import Product from "@/models/Product";
import ReturnLog from "@/models/returnLog";
import StockMovement from "@/models/stockMovement";
import { effectiveOversellMode, getGlobalOversellMode } from "@/lib/oversell";
import {
  calculateInvoiceTotals,
  computeReturnStatus,
  computeReturnedQty,
  lineMatchKey,
  canonicalizeLines,
  resolveMode,
} from "@/lib/posHelpers";
import {
  InvoiceLine,
  ReturnLogEntry,
  buildInvoiceLines,
  cancelReturnEntry,
  deductionsOf,
  diffReturnLog,
  orphanReturnUnits,
  pairSaleLines,
} from "@/lib/invoiceStock";

export class InvoiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "InvoiceError";
    this.status = status;
  }
}

export interface SaveInvoiceInput {
  // Only used (and required) when isEdit is true. New invoices always get a server-generated number.
  invoiceNo?: number;
  isEdit?: boolean;
  idempotencyKey?: string;
  productDetail: InvoiceLine[];
  discount: number;
  prevBalance: number;
  anyMessage?: string;
  dueDate?: unknown;
  invoiceDate?: unknown;
  customer?: { _id?: string; [key: string]: unknown };
  // What the client calculated. Checked against the total the server calculates from the final lines.
  grandTotal?: number;
}

const toPlain = (line: any): InvoiceLine => (line && typeof line.toObject === "function" ? line.toObject() : line);

// Work context. With a replica set `session` is set and MongoDB rolls back for us.
// On a standalone server there is no session, so every write registers an undo step instead.
interface Ctx {
  session?: ClientSession;
  undo: Array<() => Promise<void>>;
}

let transactionsSupported: boolean | undefined;

// Test helper: forget whether the server supports transactions.
export function resetTransactionSupport() {
  transactionsSupported = undefined;
}

const isTransactionUnsupported = (error: any) =>
  /Transaction numbers are only allowed|replica set member or mongos/i.test(String(error?.message)) ||
  (error?.code === 20 && /transaction/i.test(String(error?.message)));

async function rollback(ctx: Ctx) {
  for (const step of ctx.undo.reverse()) {
    try {
      await step();
    } catch (error) {
      console.error("Manual rollback step failed:", error);
    }
  }
}

// Runs `work` in a MongoDB transaction when supported. Otherwise runs it without a session and
// manually reverses every change already made if a later step fails.
// Without a transaction, concurrent edits of the same invoice are not isolated from each other.
async function runAtomic<T>(work: (ctx: Ctx) => Promise<T>): Promise<T> {
  if (transactionsSupported !== false) {
    const session = await mongoose.startSession();
    try {
      let result: T | undefined;
      await session.withTransaction(async () => {
        result = await work({ session, undo: [] });
      });
      transactionsSupported = true;
      return result as T;
    } catch (error) {
      if (!isTransactionUnsupported(error)) throw error;
      transactionsSupported = false;
      console.warn("MongoDB transactions are not supported (standalone server). Using guarded updates with manual rollback.");
    } finally {
      await session.endSession();
    }
  }

  const ctx: Ctx = { undo: [] };
  try {
    return await work(ctx);
  } catch (error) {
    await rollback(ctx);
    throw error;
  }
}

async function productLabel(id: string, session?: ClientSession): Promise<string> {
  const product = await Product.findById(id).session(session || null).select("productName").lean();
  return product?.productName || id;
}

// One atomic update that floors stock at 0. Returns the product as it was BEFORE the update,
// so the units really taken are min(before.quantity, qty).
async function floorDeduct(id: string, qty: number, session?: ClientSession) {
  return Product.findOneAndUpdate(
    { _id: id },
    [{ $set: { quantity: { $max: [0, { $subtract: ["$quantity", qty] }] } } }] as any,
    { session, new: false }
  );
}

export interface Shortfall {
  productId: string;
  productName: string;
  requested: number;
  deducted: number;
  unstocked: number;
}

// Applies every stock effect of going from oldLines to newLines and sets the server-owned stock fields
// (stockDeducted, unstockedQty, stockDeductions) on the new sale lines. Never lets stock go below 0.
//  - "clamp" products: a sale takes min(stock, qty) in one atomic update; the rest is "sold beyond stock"
//  - "block" products: the old guarded update, a sale above stock fails with 409
//  - returns add their quantity to stock; deleting/removing/decreasing restores only what was deducted
// Bundles move their components' stock, each component following the same rules.
async function settleStock(
  oldLines: InvoiceLine[],
  newLines: InvoiceLine[],
  ctx: Ctx
): Promise<{ lines: InvoiceLine[]; shortfalls: Shortfall[] }> {
  const { session } = ctx;
  const { pairs, removed } = pairSaleLines(oldLines, newLines);
  const oldOrphans = orphanReturnUnits(oldLines);
  const newOrphans = orphanReturnUnits(newLines);

  const ids = new Set<string>();
  [...pairs.map((pair) => pair.next), ...pairs.flatMap((pair) => (pair.old ? [pair.old] : [])), ...removed].forEach(
    (line) => line.productId && ids.add(String(line.productId))
  );
  [...Array.from(oldOrphans.keys()), ...Array.from(newOrphans.keys())].forEach((id) => ids.add(id));
  if (ids.size === 0) return { lines: newLines, shortfalls: [] };

  const invalid = Array.from(ids).find((id) => !mongoose.isValidObjectId(id));
  if (invalid) throw new InvoiceError(`Invalid product id: ${invalid}`, 400);

  const products = await Product.find({ _id: { $in: Array.from(ids) } })
    .session(session || null)
    .select("productName isBundle components oversellMode")
    .lean();
  const byId = new Map(products.map((product: any) => [String(product._id), product]));
  const globalMode = await getGlobalOversellMode(session);

  const infoOf = (id: string): any => {
    const product = byId.get(id);
    if (!product) throw new InvoiceError(`Product not found: ${id}`, 404);
    return product;
  };
  const targetsOf = (id: string): string[] => {
    const product = infoOf(id);
    return product.isBundle && Array.isArray(product.components) && product.components.length > 0
      ? product.components.map(String)
      : [id];
  };
  const modeOf = (id: string) => effectiveOversellMode(infoOf(id).oversellMode, globalMode);

  const give = async (targetId: string, qty: number) => {
    if (qty <= 0) return;
    const result = await Product.updateOne({ _id: targetId }, { $inc: { quantity: qty } }, { session });
    if (result.matchedCount === 0) throw new InvoiceError(`Product not found: ${targetId}`, 404);
    ctx.undo.push(async () => {
      await floorDeduct(targetId, qty);
    });
  };

  // Returns the units really taken
  const take = async (targetId: string, qty: number, mode: "clamp" | "block"): Promise<number> => {
    if (qty <= 0) return 0;
    if (mode === "block") {
      const updated = await Product.findOneAndUpdate(
        { _id: targetId, quantity: { $gte: qty } },
        { $inc: { quantity: -qty } },
        { session, new: true }
      );
      if (!updated) throw new InvoiceError(`Insufficient stock for ${await productLabel(targetId, session)}`, 409);
      ctx.undo.push(async () => {
        await Product.updateOne({ _id: targetId }, { $inc: { quantity: qty } });
      });
      return qty;
    }
    const before: any = await floorDeduct(targetId, qty, session);
    if (!before) throw new InvoiceError(`Product not found: ${targetId}`, 404);
    const deducted = Math.min(Math.max(0, Number(before.quantity) || 0), qty);
    if (deducted > 0) {
      ctx.undo.push(async () => {
        await Product.updateOne({ _id: targetId }, { $inc: { quantity: deducted } });
      });
    }
    return deducted;
  };

  interface Plan {
    index: number;
    next: InvoiceLine;
    mode: "clamp" | "block";
    targets: string[];
    keep: Map<string, number>;
    request: number;
    // Return entries cancelled on this save take their units out of stock again
    cancelTake: number;
  }
  const plans: Plan[] = [];

  // Pass 1: everything that adds stock, and the plan for what must be taken
  for (const line of removed) {
    if (!line.productId) continue;
    const returned = computeReturnedQty(line);
    const targets = targetsOf(String(line.productId));
    const deducted = deductionsOf(line, targets);
    for (const target of targets) await give(target, Math.max(0, (deducted.get(target) || 0) - returned));
  }

  for (const pair of pairs) {
    const { next, old } = pair;
    if (!next.productId) continue;
    const productId = String(next.productId);
    const targets = targetsOf(productId);
    const qty = Math.max(0, Number(next.quantity) || 0);
    const keep = new Map<string, number>();
    let request = qty;
    let cancelTake = 0;

    if (old) {
      const oldQty = Math.max(0, Number(old.quantity) || 0);
      const deducted = deductionsOf(old, targets);
      const returnDelta = computeReturnedQty(next) - computeReturnedQty(old);
      request = Math.max(0, qty - oldQty);
      for (const target of targets) {
        const had = deducted.get(target) || 0;
        keep.set(target, Math.min(had, qty));
        await give(target, Math.max(0, had - qty));
        if (returnDelta > 0) await give(target, returnDelta);
      }
      cancelTake = returnDelta < 0 ? -returnDelta : 0;
    }
    plans.push({ index: pair.index, next, mode: modeOf(productId), targets, keep, request, cancelTake });
  }

  const orphanIds = new Set([...Array.from(oldOrphans.keys()), ...Array.from(newOrphans.keys())]);
  const orphanTakes: Array<[string, number]> = [];
  for (const id of Array.from(orphanIds)) {
    const delta = (newOrphans.get(id) || 0) - (oldOrphans.get(id) || 0);
    if (delta > 0) for (const target of targetsOf(id)) await give(target, delta);
    if (delta < 0) orphanTakes.push([id, -delta]);
  }

  // Pass 2: everything that takes stock
  const lines = newLines.map((line) => ({ ...line }));
  const shortfalls: Shortfall[] = [];

  for (const plan of plans) {
    const deductions: Array<{ productId: string; qty: number }> = [];
    let requestedDeducted = plan.request;
    for (const target of plan.targets) {
      if (plan.cancelTake > 0) await take(target, plan.cancelTake, plan.mode);
      const taken = await take(target, plan.request, plan.mode);
      requestedDeducted = Math.min(requestedDeducted, taken);
      deductions.push({ productId: target, qty: (plan.keep.get(target) || 0) + taken });
    }

    const quantity = Math.max(0, Number(plan.next.quantity) || 0);
    const stockDeducted = Math.min(...deductions.map((entry) => entry.qty));
    lines[plan.index] = {
      ...plan.next,
      stockDeducted,
      unstockedQty: Math.max(0, quantity - stockDeducted),
      stockDeductions: deductions,
    };

    if (plan.request > requestedDeducted) {
      shortfalls.push({
        productId: String(plan.next.productId),
        productName: String(plan.next.productName),
        requested: plan.request,
        deducted: requestedDeducted,
        unstocked: plan.request - requestedDeducted,
      });
    }
  }

  for (const [id, qty] of orphanTakes) {
    for (const target of targetsOf(id)) await take(target, qty, modeOf(id));
  }

  return { lines, shortfalls };
}

async function writeStockMovements(
  shortfalls: Shortfall[],
  invoice: { _id: unknown; invoiceNo?: number },
  user: string,
  ctx: Ctx,
  date: Date
) {
  if (shortfalls.length === 0) return;
  const docs = await StockMovement.insertMany(
    shortfalls.map((entry) => ({ ...entry, type: "sold_beyond_stock", invoiceId: invoice._id, invoiceNo: invoice.invoiceNo, user, date })),
    { session: ctx.session }
  );
  const ids = (docs || []).map((doc: any) => doc._id);
  ctx.undo.push(async () => {
    await StockMovement.deleteMany({ _id: { $in: ids } });
  });
}

async function writeReturnLog(
  entries: ReturnLogEntry[],
  invoice: { _id: unknown; invoiceNo?: number },
  user: string,
  ctx: Ctx,
  date: Date = new Date()
) {
  if (entries.length === 0) return;
  const docs = await ReturnLog.insertMany(
    entries.map((entry) => ({ ...entry, invoiceId: invoice._id, invoiceNo: invoice.invoiceNo, user, date })),
    { session: ctx.session }
  );
  const ids = (docs || []).map((doc: any) => doc._id);
  ctx.undo.push(async () => {
    await ReturnLog.deleteMany({ _id: { $in: ids } });
  });
}

const snapshotOf = (doc: any) => (typeof doc.toObject === "function" ? doc.toObject() : { ...doc });

const COUNTER_ID = "invoiceNo";

export interface SaveResult {
  invoice: any;
  created: boolean;
  duplicate?: boolean;
}

// Hands out the next invoice number. Runs inside the save's transaction, so a rolled-back save gives its number back.
// The counter is first raised to the highest existing invoice number (seeding on first use / after imports),
// then incremented atomically.
async function allocateInvoiceNo(ctx: Ctx): Promise<number> {
  const { session } = ctx;
  const last: any = await Invoice.findOne({})
    .sort({ invoiceNo: -1 })
    .select("invoiceNo")
    .session(session || null)
    .lean();
  const highest = Number(last?.invoiceNo || 0);

  await InvoiceCounter.updateOne({ _id: COUNTER_ID }, { $max: { seq: highest } }, { upsert: true, session });
  const counter: any = await InvoiceCounter.findOneAndUpdate(
    { _id: COUNTER_ID },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  );
  const allocated = Number(counter.seq);

  // Standalone fallback only: give the number back, but only if nobody was issued a later one.
  // If another save already took a later number, the counter is left alone and a gap remains.
  // A rare gap can still occur (the counter may also be raised by concurrent seeding).
  ctx.undo.push(async () => {
    await InvoiceCounter.updateOne({ _id: COUNTER_ID, seq: allocated }, { $inc: { seq: -1 } });
  });
  return allocated;
}

// Read-only: the number the next new invoice is expected to get. Never writes, so it can be shown in the UI.
export async function getNextInvoicePreview(): Promise<number> {
  const counter: any = await InvoiceCounter.findOne({ _id: COUNTER_ID }).lean();
  const last: any = await Invoice.findOne({}).sort({ invoiceNo: -1 }).select("invoiceNo").lean();
  return Math.max(Number(counter?.seq || 0), Number(last?.invoiceNo || 0)) + 1;
}

type LineBuilder = (
  existingLines: InvoiceLine[],
  context: { now: Date; user: string }
) => { ok: true; lines: InvoiceLine[] } | { ok: false; error: string };

// `build` decides the final lines. By default they come from the client's lines (buildInvoiceLines);
// adding or cancelling a return on a stored invoice passes its own builder.
async function persistInvoice(input: SaveInvoiceInput, user: string, ctx: Ctx, build?: LineBuilder): Promise<SaveResult> {
  const { session } = ctx;

  // Same idempotency key as an earlier save: return that invoice and touch nothing else
  if (input.idempotencyKey) {
    const duplicate = await Invoice.findOne({ idempotencyKey: input.idempotencyKey }).session(session || null);
    if (duplicate) return { invoice: duplicate, created: false, duplicate: true };
  }

  // New invoices ignore any client-supplied number. Only an explicit edit looks an invoice up by number.
  let existing: any = null;
  if (input.isEdit) {
    if (!input.invoiceNo) throw new InvoiceError("invoiceNo is required to edit an invoice", 400);
    existing = await Invoice.findOne({ invoiceNo: input.invoiceNo }).session(session || null);
    if (!existing) throw new InvoiceError(`Invoice ${input.invoiceNo} not found`, 404);
  }
  if (existing?.voided) throw new InvoiceError(`Invoice ${existing.invoiceNo} is void and cannot be changed`, 409);
  const oldLines = existing ? (canonicalizeLines(existing.productDetail.map(toPlain)) as InvoiceLine[]) : [];
  const before = existing ? snapshotOf(existing) : null;

  // One server timestamp for the new return entries and their return-log rows
  const now = new Date();
  const built = (build || ((old, c) => buildInvoiceLines(old, input.productDetail, c)))(oldLines, { now, user });
  if (!built.ok) throw new InvoiceError(built.error, 400);
  const lines = built.lines;

  const { grandTotal } = calculateInvoiceTotals({ items: lines, discount: input.discount });
  if (input.grandTotal !== undefined && Math.abs(Number(input.grandTotal) - grandTotal) > 0.01) {
    throw new InvoiceError("Invoice total does not match product lines and discount", 400);
  }

  const settled = await settleStock(oldLines, lines, ctx);
  const returnEntries = diffReturnLog(oldLines, lines);

  const fields = {
    productDetail: settled.lines,
    prevBalance: Number(input.prevBalance || 0),
    grandTotal,
    // Recalculated from the lines on every save
    returnStatus: computeReturnStatus(settled.lines),
    anyMessage: input.anyMessage || "",
    dueDate: input.dueDate || null,
    status: input.dueDate == null ? "Clear" : "Pending",
    discount: Number(input.discount || 0),
  };

  if (existing) {
    // An edit keeps its original invoice number and idempotency key
    if (input.customer) existing.customer = input.customer;
    Object.assign(existing, fields);
    const updated = await existing.save({ session });
    ctx.undo.push(async () => {
      await Invoice.replaceOne({ _id: before._id }, before);
    });
    await writeReturnLog(returnEntries, updated, user, ctx, now);
    await writeStockMovements(settled.shortfalls, updated, user, ctx, now);

    if (input.customer?._id) {
      await Customer.findByIdAndUpdate(input.customer._id, { $set: input.customer }, { new: true, session });
    }
    return { invoice: updated, created: false };
  }

  const invoiceNo = await allocateInvoiceNo(ctx);
  const invoice = new Invoice({
    invoiceNo,
    customer: input.customer,
    invoiceDate: input.invoiceDate,
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    ...fields,
  });
  const saved = await invoice.save({ session });
  ctx.undo.push(async () => {
    await Invoice.deleteOne({ _id: saved._id });
  });
  await writeReturnLog(returnEntries, saved, user, ctx, now);
  await writeStockMovements(settled.shortfalls, saved, user, ctx, now);
  return { invoice: saved, created: true };
}

// Saves the invoice and applies every stock change atomically: in one MongoDB transaction when
// available, otherwise with guarded updates and a manual rollback. A failure leaves nothing changed.
export async function saveInvoiceWithStock(input: SaveInvoiceInput, user = ""): Promise<SaveResult> {
  try {
    return await runAtomic((ctx) => persistInvoice(input, user, ctx));
  } catch (error: any) {
    // Two requests with the same key raced past the lookup: the unique index let only one through.
    // The loser has been rolled back, so hand back the winner's invoice.
    const isKeyRace =
      error?.code === 11000 && /idempotencyKey/.test(`${error?.message} ${JSON.stringify(error?.keyPattern || {})}`);
    if (input.idempotencyKey && isKeyRace) {
      const original = await Invoice.findOne({ idempotencyKey: input.idempotencyKey });
      if (original) return { invoice: original, created: false, duplicate: true };
    }
    throw error;
  }
}

// Deletes an invoice and reverses its stock effect atomically:
// sold units go back to stock, returned units are taken out again.
// Allowed for an invoice without lines, or for an admin. The invoice number is never given back.
// If any step fails, nothing is changed.
export async function deleteInvoiceWithStock(
  invoiceId: string,
  user = "",
  options: { isAdmin?: boolean; confirmed?: boolean } = {}
) {
  await runAtomic(async (ctx) => {
    const invoice = await Invoice.findById(invoiceId).session(ctx.session || null);
    if (!invoice) throw new InvoiceError("Invoice not found", 404);

    const before = snapshotOf(invoice);
    const lines: InvoiceLine[] = invoice.productDetail.map(toPlain);
    if (lines.length > 0 && !options.isAdmin) {
      throw new InvoiceError("Only an admin can delete an invoice that has items", 403);
    }
    if (lines.length > 0 && !options.confirmed) {
      throw new InvoiceError("Deleting an invoice with items needs confirmation", 400);
    }

    // A void invoice already gave its stock back, so deleting it must not do it again
    if (!invoice.voided) {
      await settleStock(lines, [], ctx);
      await writeReturnLog(diffReturnLog(lines, []), invoice, user, ctx);
    }
    await Invoice.deleteOne({ _id: invoice._id }, { session: ctx.session });
    ctx.undo.push(async () => {
      await Invoice.replaceOne({ _id: before._id }, before, { upsert: true });
    });
  });
}

// Cancels an invoice: stock is restored once, the record stays visible and is flagged void.
export async function voidInvoiceWithStock(invoiceId: string, user = "", reason = "") {
  return runAtomic(async (ctx) => {
    const invoice = await Invoice.findById(invoiceId).session(ctx.session || null);
    if (!invoice) throw new InvoiceError("Invoice not found", 404);
    if (invoice.voided) throw new InvoiceError("Invoice is already void", 409);

    const before = snapshotOf(invoice);
    const lines: InvoiceLine[] = invoice.productDetail.map(toPlain);
    await settleStock(lines, [], ctx);
    await writeReturnLog(diffReturnLog(lines, []), invoice, user, ctx);

    invoice.voided = true;
    invoice.voidedAt = new Date();
    invoice.voidedBy = user;
    invoice.voidReason = reason;
    const saved = await invoice.save({ session: ctx.session });
    ctx.undo.push(async () => {
      await Invoice.replaceOne({ _id: before._id }, before);
    });
    return saved;
  });
}

export interface ReturnRequest {
  productId: string;
  quantity: number;
  reason?: string;
}

// Adds returns to an existing invoice (matched by Mongo _id). Each return becomes an entry in returns[]
// of the original sale line; no line is added. The invoice is read inside the atomic block so a
// concurrent return cannot be counted twice (fully guaranteed with transactions only).
export async function addReturnsToInvoice(invoiceId: string, returns: ReturnRequest[], user = "") {
  return runAtomic(async (ctx) => {
    const invoice = await Invoice.findById(invoiceId).session(ctx.session || null);
    if (!invoice) throw new InvoiceError("Invoice not found", 404);

    return persistInvoice(invoiceInput(invoice), user, ctx, (old, context) => {
      const sale = old.filter((line) => resolveMode(line) === "sale");
      // Old return lines without a sale line stay on the invoice
      const orphans = old.filter((line) => resolveMode(line) === "return");
      const requests = returns.map(({ productId, quantity, reason }) => {
        const key = lineMatchKey({ productId });
        const target = sale.find((line) => lineMatchKey(line) === key);
        return {
          productId,
          productName: target?.productName || String(productId),
          quantity,
          sellPrice: target?.sellPrice || 0,
          mode: "return",
          ...(reason ? { returnReason: reason } : {}),
        };
      });
      return buildInvoiceLines(old, [...sale, ...orphans, ...requests], context);
    });
  });
}

// Marks one return of a stored invoice as cancelled (kept for audit) and puts its units back out of stock.
export async function cancelReturnOnInvoice(invoiceId: string, lineIndex: number, returnIndex: number, user = "") {
  return runAtomic(async (ctx) => {
    const invoice = await Invoice.findById(invoiceId).session(ctx.session || null);
    if (!invoice) throw new InvoiceError("Invoice not found", 404);

    return persistInvoice(invoiceInput(invoice), user, ctx, (old, context) =>
      cancelReturnEntry(old, lineIndex, returnIndex, context)
    );
  });
}

const invoiceInput = (invoice: any): SaveInvoiceInput => ({
  invoiceNo: invoice.invoiceNo,
  isEdit: true,
  productDetail: [],
  discount: invoice.discount || 0,
  prevBalance: invoice.prevBalance || 0,
  anyMessage: invoice.anyMessage,
  dueDate: invoice.dueDate,
});
