import { canonicalizeLines, computeReturnedQty, getNetQty, lineMatchKey, resolveMode } from "./posHelpers";

export interface ReturnEntry {
  qty: number;
  // Set by the server when the return is saved. Legacy returns have no time.
  at?: Date | string;
  reason?: string;
  user?: string;
  refundAmount?: number;
  cancelled?: boolean;
  cancelledAt?: Date | string;
  cancelledBy?: string;
}

export interface InvoiceLine {
  productId?: unknown;
  productName: string;
  quantity: number;
  sellPrice: number;
  mode?: string;
  return?: boolean;
  sold?: boolean;
  returnedQty?: number;
  returnReason?: string;
  returns?: ReturnEntry[];
  [key: string]: unknown;
}

export type NormalizedLine = InvoiceLine & { returns: ReturnEntry[]; returnedQty: number };

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

const isReturnLine = (line: InvoiceLine) => resolveMode(line) === "return";

const lineQty = (line: InvoiceLine): number => {
  const quantity = Number(line.quantity);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
};

const toCanonical = (lines: InvoiceLine[]): InvoiceLine[] => canonicalizeLines(lines as any[]) as InvoiceLine[];

// Units that leave stock per product: sold minus returned units of each sale line.
export function netUnitsByProduct(lines: InvoiceLine[]): Map<string, number> {
  const net = new Map<string, number>();
  for (const line of toCanonical(lines)) {
    if (!line.productId) continue;
    const key = String(line.productId);
    const units = isReturnLine(line) ? -lineQty(line) : getNetQty(line);
    net.set(key, (net.get(key) || 0) + units);
  }
  return net;
}

// Stock change per product when an invoice goes from oldLines to newLines.
// Negative = take from stock, positive = add to stock. Unchanged products are omitted.
export function diffStockChange(oldLines: InvoiceLine[], newLines: InvoiceLine[]): Map<string, number> {
  const oldNet = netUnitsByProduct(oldLines);
  const newNet = netUnitsByProduct(newLines);
  const change = new Map<string, number>();

  for (const key of Array.from(new Set([...Array.from(oldNet.keys()), ...Array.from(newNet.keys())]))) {
    const delta = (oldNet.get(key) || 0) - (newNet.get(key) || 0);
    if (delta !== 0) change.set(key, delta);
  }
  return change;
}

// Fields only the server may write. Anything the client sends for them is dropped.
const SERVER_STOCK_FIELDS = ["stockDeducted", "unstockedQty", "stockDeductions"] as const;

export const stripServerStockFields = (line: InvoiceLine): InvoiceLine => {
  const copy: InvoiceLine = { ...line };
  SERVER_STOCK_FIELDS.forEach((field) => delete copy[field]);
  return copy;
};

export interface LinePair {
  // Index into the new lines array
  index: number;
  next: InvoiceLine;
  // The stored sale line this one continues, if any
  old?: InvoiceLine;
}

// Pairs every new sale line with the stored sale line it continues (same match key, in order, each stored
// line used once - the same rule buildInvoiceLines uses). Stored sale lines left over were removed.
export function pairSaleLines(oldLines: InvoiceLine[], newLines: InvoiceLine[]) {
  const stored = toCanonical(oldLines).filter((line) => !isReturnLine(line));
  const claimed = new Set<InvoiceLine>();
  const pairs: LinePair[] = [];

  newLines.forEach((next, index) => {
    if (isReturnLine(next)) return;
    const key = lineMatchKey(next);
    const old = key ? stored.find((line) => !claimed.has(line) && lineMatchKey(line) === key) : undefined;
    if (old) claimed.add(old);
    pairs.push({ index, next, old });
  });

  return { pairs, removed: stored.filter((line) => !claimed.has(line)) };
}

// Units added to stock by return lines that have no sale line, per product.
export function orphanReturnUnits(lines: InvoiceLine[]): Map<string, number> {
  const units = new Map<string, number>();
  for (const line of toCanonical(lines)) {
    if (!isReturnLine(line) || !line.productId) continue;
    const key = String(line.productId);
    units.set(key, (units.get(key) || 0) + lineQty(line));
  }
  return units;
}

// Units really deducted from each stock product (the product, or each bundle component) for a stored line.
// Legacy lines have no stock fields and count as fully deducted.
export function deductionsOf(line: InvoiceLine, targets: string[]): Map<string, number> {
  const result = new Map<string, number>();
  const list = Array.isArray(line.stockDeductions) ? (line.stockDeductions as Array<{ productId: unknown; qty: number }>) : [];
  if (list.length > 0) {
    list.forEach((entry) => result.set(String(entry.productId), Math.max(0, Number(entry.qty) || 0)));
    targets.forEach((id) => {
      if (!result.has(id)) result.set(id, 0);
    });
    return result;
  }
  const single = typeof line.stockDeducted === "number" && targets.length === 1 ? line.stockDeducted : undefined;
  targets.forEach((id) => result.set(id, single ?? lineQty(line)));
  return result;
}

// A return with no matching sale line (or more than is left to return) is an error.
export function validateReturns(lines: InvoiceLine[]): { ok: true } | { ok: false; error: string } {
  for (const line of toCanonical(lines)) {
    if (!isReturnLine(line)) continue;
    if (!line.productId) {
      return { ok: false, error: `Cannot return "${line.productName}": it has no product id.` };
    }
    return {
      ok: false,
      error: `Cannot return ${lineQty(line)} of "${line.productName}": it was not sold on this invoice, or all of it is already returned.`,
    };
  }
  return { ok: true };
}

// Return-log entries when an invoice goes from oldLines to newLines.
// Positive = units/amount newly refunded, negative = a return that was cancelled or reversed.
export interface ReturnLogEntry {
  productId: string;
  productName: string;
  quantity: number;
  refundAmount: number;
  reason: string;
}

export function diffReturnLog(oldLines: InvoiceLine[], newLines: InvoiceLine[]): ReturnLogEntry[] {
  const summarize = (lines: InvoiceLine[]) => {
    const map = new Map<string, { name: string; qty: number; amount: number; reason: string }>();
    for (const line of toCanonical(lines)) {
      if (!line.productId || isReturnLine(line)) continue;
      const key = String(line.productId);
      const entry = map.get(key) || { name: line.productName, qty: 0, amount: 0, reason: "" };
      for (const item of line.returns || []) {
        if (item.cancelled) continue;
        entry.qty += Number(item.qty) || 0;
        entry.amount += Number(item.qty) * (Number(line.sellPrice) || 0);
        if (item.reason) entry.reason = String(item.reason);
      }
      map.set(key, entry);
    }
    return map;
  };

  const before = summarize(oldLines);
  const after = summarize(newLines);
  const entries: ReturnLogEntry[] = [];

  for (const key of Array.from(new Set([...Array.from(before.keys()), ...Array.from(after.keys())]))) {
    const prev = before.get(key);
    const next = after.get(key);
    const quantity = (next?.qty || 0) - (prev?.qty || 0);
    if (quantity === 0) continue;

    entries.push({
      productId: key,
      productName: (next || prev)!.name,
      quantity,
      refundAmount: (next?.amount || 0) - (prev?.amount || 0),
      reason: (quantity > 0 ? next?.reason : prev?.reason) || "",
    });
  }
  return entries;
}

const cleanEntry = (entry: ReturnEntry): ReturnEntry => ({ ...entry });

// Builds the lines to store from the client's lines. The client never decides what was returned:
//  - returns[] and returnedQty sent by the client are ignored; they are carried over from the stored invoice
//  - incoming "return" lines are NEW returns. Each is added to returns[] of the matching sale line,
//    stamped with the server time `now`. No new line is created.
export function buildInvoiceLines(
  existingLines: InvoiceLine[],
  incoming: InvoiceLine[],
  context: { now: Date; user?: string }
): Result<{ lines: NormalizedLine[] }> {
  const stored = toCanonical(existingLines).filter((line) => !isReturnLine(line));
  // Old return lines with no matching sale line. They are history, so an incoming return line that
  // matches one of them keeps it; it is not treated as a new return.
  const storedOrphans = toCanonical(existingLines)
    .filter(isReturnLine)
    .map((line) => ({ line, left: lineQty(line) }));
  const orphanKey = (line: InvoiceLine) => lineMatchKey(line) ?? `name:${line.productName}`;
  const keptOrphans: InvoiceLine[] = [];
  const claimed = new Set<InvoiceLine>();

  const saleLines: InvoiceLine[] = [];
  const returnRequests: InvoiceLine[] = [];

  for (const line of incoming) {
    if (isReturnLine(line)) {
      let qty = lineQty(line);
      for (const orphan of storedOrphans) {
        if (qty <= 0) break;
        if (orphan.left <= 0 || orphanKey(orphan.line) !== orphanKey(line)) continue;
        const take = Math.min(orphan.left, qty);
        orphan.left -= take;
        qty -= take;
        const { at: _a, ...kept } = orphan.line as InvoiceLine;
        keptOrphans.push({ ...kept, quantity: take, mode: "return", return: true, sold: false, returns: [], returnedQty: 0 });
      }
      if (qty > 0) returnRequests.push({ ...line, quantity: qty });
      continue;
    }
    const { returns: _ignoredReturns, returnedQty: _ignoredQty, ...withStock } = line;
    const clean = stripServerStockFields(withStock as InvoiceLine);
    const key = lineMatchKey(line);
    const match = key ? stored.find((old) => !claimed.has(old) && lineMatchKey(old) === key) : undefined;
    if (match) claimed.add(match);

    const returns = (match?.returns || []).map(cleanEntry);
    const next: InvoiceLine = { ...clean, mode: "sale", return: false, sold: true, returns };
    if (lineQty(line) < computeReturnedQty(next)) {
      return {
        ok: false,
        error: `Quantity of "${line.productName}" cannot be below the ${computeReturnedQty(next)} already returned.`,
      };
    }
    saleLines.push(next);
  }

  const dropped = stored.find((old) => !claimed.has(old) && computeReturnedQty(old) > 0);
  if (dropped) {
    return { ok: false, error: `"${dropped.productName}" has returns and cannot be removed. Cancel its returns first.` };
  }

  for (const request of returnRequests) {
    const key = lineMatchKey(request);
    const qty = lineQty(request);
    if (!key) return { ok: false, error: `Cannot return "${request.productName}": it has no product id.` };
    if (!Number.isInteger(qty) || qty <= 0) {
      return { ok: false, error: `Return quantity of "${request.productName}" must be a whole number above 0.` };
    }

    let remaining = qty;
    for (const sale of saleLines) {
      if (remaining <= 0) break;
      if (lineMatchKey(sale) !== key) continue;
      const room = lineQty(sale) - computeReturnedQty(sale);
      const take = Math.min(room, remaining);
      if (take <= 0) continue;
      (sale.returns as ReturnEntry[]).push({
        qty: take,
        at: context.now,
        reason: request.returnReason || "",
        user: context.user || "",
        refundAmount: take * (Number(sale.sellPrice) || 0),
        cancelled: false,
      });
      remaining -= take;
    }
    if (remaining > 0) {
      return {
        ok: false,
        error: `Cannot return ${qty} of "${request.productName}": only ${qty - remaining} can still be returned on this invoice.`,
      };
    }
  }

  const lines = [
    ...saleLines.map((line) => ({ ...line, returnedQty: computeReturnedQty(line) })),
    ...keptOrphans,
  ] as NormalizedLine[];
  const invalid = lines.find(
    (line) => !isReturnLine(line) && (line.returnedQty < 0 || line.returnedQty > lineQty(line))
  );
  if (invalid) {
    return { ok: false, error: `Returned quantity of "${invalid.productName}" must be between 0 and ${lineQty(invalid)}.` };
  }
  return { ok: true, lines };
}

// Marks one return entry as cancelled (it stays on the invoice for audit).
// Indexes refer to the canonical lines, which every screen reads with canonicalizeLines.
export function cancelReturnEntry(
  existingLines: InvoiceLine[],
  lineIndex: number,
  returnIndex: number,
  context: { now: Date; user?: string }
): Result<{ lines: NormalizedLine[] }> {
  const lines = toCanonical(existingLines).map((line) => ({
    ...line,
    returns: (line.returns || []).map(cleanEntry),
  }));
  const entry = lines[lineIndex]?.returns?.[returnIndex];
  if (!entry || isReturnLine(lines[lineIndex])) return { ok: false, error: "Return not found" };
  if (entry.cancelled) return { ok: false, error: "This return is already cancelled" };

  entry.cancelled = true;
  entry.cancelledAt = context.now;
  entry.cancelledBy = context.user || "";
  return { ok: true, lines: lines.map((line) => ({ ...line, returnedQty: computeReturnedQty(line) })) as NormalizedLine[] };
}
