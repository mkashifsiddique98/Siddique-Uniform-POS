import { store, addToChart, addMultipleToChart, clearChart, syncCartStock, updateChart, findStockConflicts } from "../store";

const A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbb";

const line = (productId: string, quantity: number, stock?: number, extra: Record<string, unknown> = {}) =>
  ({ productId, productName: `P-${productId[0]}`, quantity, sellPrice: 10, stock, oversellMode: "block", ...extra } as any);

const cart = () => store.getState().chart.chartList;

beforeEach(() => {
  store.dispatch(clearChart());
});

describe("clamp mode (default)", () => {
  test("increasing above stock is allowed and never flagged", () => {
    store.dispatch(addToChart(line(A, 2, 2, { oversellMode: "clamp" })));
    store.dispatch(updateChart({ productId: A, productName: "P-a", quantity: 5 }));
    expect(cart()[0].quantity).toBe(7);
    store.dispatch(syncCartStock([{ _id: A, quantity: 0 }] as any));
    expect(cart()[0].stock).toBe(0);
    expect(cart()[0].stockShort).toBeFalsy();
    expect(findStockConflicts([line(A, 4, 5, { oversellMode: "clamp" })], [{ _id: A, quantity: 0 }])).toHaveLength(0);
  });

  test("stock below 0 is shown as 0", () => {
    store.dispatch(addToChart(line(A, 1, 3, { oversellMode: "clamp" })));
    store.dispatch(syncCartStock([{ _id: A, quantity: -4 }] as any));
    expect(cart()[0].stock).toBe(0);
  });
});

describe("syncCartStock", () => {
  test("updates the stock snapshot of lines matched by productId", () => {
    store.dispatch(addToChart(line(A, 2, 5)));
    store.dispatch(addToChart(line(B, 1, 5)));

    store.dispatch(syncCartStock([{ _id: A, quantity: 9 }] as any));

    expect(cart().find((l) => l.productId === A)?.stock).toBe(9);
    expect(cart().find((l) => l.productId === B)?.stock).toBe(5);
  });

  test("never changes the quantity, only flags a line above the new stock", () => {
    store.dispatch(addToChart(line(A, 4, 5)));

    store.dispatch(syncCartStock([{ _id: A, quantity: 2 }] as any));

    const synced = cart()[0];
    expect(synced.quantity).toBe(4);
    expect(synced.stock).toBe(2);
    expect(synced.stockShort).toBe(true);
  });

  test("clears the flag when stock is enough again", () => {
    store.dispatch(addToChart(line(A, 4, 5)));
    store.dispatch(syncCartStock([{ _id: A, quantity: 2 }] as any));
    store.dispatch(syncCartStock([{ _id: A, quantity: 6 }] as any));
    expect(cart()[0].stockShort).toBe(false);
  });

  test("the flag clears when the cashier lowers the quantity", () => {
    store.dispatch(addToChart(line(A, 4, 5)));
    store.dispatch(syncCartStock([{ _id: A, quantity: 2 }] as any));
    store.dispatch(updateChart({ productId: A, productName: "P-a", quantity: -2 }));
    expect(cart()[0].quantity).toBe(2);
    expect(cart()[0].stockShort).toBe(false);
  });

  test("ignores lines without a snapshot (edit mode, bundles), special items and return lines", () => {
    store.dispatch(addMultipleToChart([line(A, 3, undefined), line(B, 3, 5, { mode: "return" })]));
    store.dispatch(addToChart({ productName: "Special", quantity: 2, sellPrice: 5, stock: undefined } as any));

    store.dispatch(syncCartStock([{ _id: A, quantity: 1 }, { _id: B, quantity: 1 }] as any));

    cart().forEach((l) => expect(l.stockShort).toBeUndefined());
    expect(cart().find((l) => l.productId === A)?.stock).toBeUndefined();
  });

  test("a product missing from the new list leaves its line unchanged", () => {
    store.dispatch(addToChart(line(A, 2, 5)));
    store.dispatch(syncCartStock([]));
    expect(cart()[0].stock).toBe(5);
    expect(cart()[0].stockShort).toBeUndefined();
  });

  test("findStockConflicts reports only lines above the new stock", () => {
    const conflicts = findStockConflicts([line(A, 4, 5), line(B, 1, 5)], [
      { _id: A, quantity: 2 },
      { _id: B, quantity: 2 },
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].available).toBe(2);
    expect(conflicts[0].line.productId).toBe(A);
  });
});
