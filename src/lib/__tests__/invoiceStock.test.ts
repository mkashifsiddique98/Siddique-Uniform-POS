import {
  buildInvoiceLines,
  cancelReturnEntry,
  diffReturnLog,
  diffStockChange,
  validateReturns,
} from "../invoiceStock";
import { canonicalizeLines, getNetQty } from "../posHelpers";

const sale = (productId: string, quantity: number) => ({ productId, productName: productId, quantity, sellPrice: 10 });
const ret = (productId: string, quantity: number) => ({ ...sale(productId, quantity), mode: "return" });
const NOW = new Date("2025-03-01T10:00:00Z");
const ctx = { now: NOW, user: "cashier" };

const build = (existing: any[], incoming: any[]) => {
  const result = buildInvoiceLines(existing, incoming, ctx);
  if (!result.ok) throw new Error(result.error);
  return result.lines;
};

describe("invoiceStock", () => {
  test("legacy lines without a mode are treated as sales, even with a legacy return flag", () => {
    const legacy = { productId: "a", productName: "a", quantity: 2, sellPrice: 10, return: true };
    expect(diffStockChange([], [legacy]).get("a")).toBe(-2);
    expect(validateReturns([legacy])).toEqual({ ok: true });
  });

  test("new invoice takes sold units from stock and puts returned units back", () => {
    const change = diffStockChange([], build([], [sale("a", 3), sale("b", 2)]));
    expect(change.get("a")).toBe(-3);
    expect(change.get("b")).toBe(-2);
  });

  test("editing an invoice only adjusts the difference", () => {
    const change = diffStockChange([sale("a", 3), sale("b", 2)], [sale("a", 5), sale("b", 2)]);
    expect(change.get("a")).toBe(-2);
    expect(change.has("b")).toBe(false);
  });

  test("lines without a product id never change stock", () => {
    expect(diffStockChange([], [{ productName: "special", quantity: 2, sellPrice: 50 }]).size).toBe(0);
  });

  test("sell 3, return 1: one line, one entry with the server time, net 2, stock +1", () => {
    const old = [sale("a", 3)];
    const next = build(old, [sale("a", 3), ret("a", 1)]);
    expect(next).toHaveLength(1);
    expect(next[0].returns).toHaveLength(1);
    expect(next[0].returns[0]).toMatchObject({ qty: 1, at: NOW, user: "cashier", refundAmount: 10, cancelled: false });
    expect(next[0].returnedQty).toBe(1);
    expect(getNetQty(next[0])).toBe(2);
    expect(diffStockChange(old, next).get("a")).toBe(1);
    expect(diffReturnLog(old, next)).toEqual([
      { productId: "a", productName: "a", quantity: 1, refundAmount: 10, reason: "" },
    ]);
  });

  test("return 2 more adds entries up to the sold quantity, one more is rejected", () => {
    const first = build([sale("a", 3)], [sale("a", 3), ret("a", 1)]);
    const second = build(first, [sale("a", 3), ret("a", 2)]);
    expect(second).toHaveLength(1);
    expect(second[0].returns.map((entry) => entry.qty)).toEqual([1, 2]);
    expect(second[0].returnedQty).toBe(3);

    const third = buildInvoiceLines(second, [sale("a", 3), ret("a", 1)], ctx);
    expect(third.ok).toBe(false);
  });

  test("cancelling a return keeps the entry, recalculates returnedQty and gives stock back", () => {
    const old = build([sale("a", 3)], [sale("a", 3), ret("a", 2)]);
    const cancelled = cancelReturnEntry(old, 0, 0, ctx);
    if (!cancelled.ok) throw new Error(cancelled.error);
    expect(cancelled.lines[0].returns).toHaveLength(1);
    expect(cancelled.lines[0].returns[0].cancelled).toBe(true);
    expect(cancelled.lines[0].returnedQty).toBe(0);
    expect(diffStockChange(old, cancelled.lines).get("a")).toBe(-2);
  });

  test("same name with different product ids stay separate lines", () => {
    const lines = [
      { productId: "x1", productName: "Shirt", quantity: 2, sellPrice: 10 },
      { productId: "x2", productName: "Shirt", quantity: 2, sellPrice: 10 },
    ];
    const next = build(lines, [...lines, { ...lines[1], mode: "return", quantity: 1 }]);
    expect(next).toHaveLength(2);
    expect(next[0].returnedQty).toBe(0);
    expect(next[1].returnedQty).toBe(1);
  });

  test("the client cannot send its own returns, time or returnedQty", () => {
    const forged = {
      ...sale("a", 3),
      returnedQty: 3,
      returns: [{ qty: 3, at: "2000-01-01T00:00:00Z", user: "me", refundAmount: 999 }],
    };
    const next = build([sale("a", 3)], [forged]);
    expect(next[0].returns).toEqual([]);
    expect(next[0].returnedQty).toBe(0);

    const withReturn = build([sale("a", 3)], [sale("a", 3), { ...ret("a", 1), at: "2000-01-01", returnedQty: 9 }]);
    expect(withReturn[0].returns[0].at).toBe(NOW);
    expect(withReturn[0].returnedQty).toBe(1);
  });

  test("a return for a product that is not on the invoice is rejected", () => {
    expect(buildInvoiceLines([sale("a", 3)], [sale("a", 3), ret("b", 1)], ctx).ok).toBe(false);
  });

  test("quantity cannot go below what was returned and a returned line cannot be removed", () => {
    const old = build([sale("a", 3)], [sale("a", 3), ret("a", 2)]);
    expect(buildInvoiceLines(old, [sale("a", 1)], ctx).ok).toBe(false);
    expect(buildInvoiceLines(old, [], ctx).ok).toBe(false);
  });

  test("legacy invoice with a sale line and a separate return line reads as one line with no time", () => {
    const legacy = [sale("a", 3), { ...ret("a", 1), return: true, sold: false }];
    const lines = canonicalizeLines(legacy);
    expect(lines).toHaveLength(1);
    expect(lines[0].returnedQty).toBe(1);
    expect(lines[0].returns).toHaveLength(1);
    expect(lines[0].returns[0].at).toBeUndefined();
    expect(diffStockChange([], legacy).get("a")).toBe(-2);
  });
});
