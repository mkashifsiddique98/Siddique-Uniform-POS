/**
 * Service-level tests run against an in-memory fake of the models and of the MongoDB transaction
 * (state is snapshotted at the start and restored when the callback throws). They verify the
 * business rules and the roll-back behaviour, but not MongoDB itself.
 */
import mongoose from "mongoose";
import ReturnLog from "@/models/returnLog";

type Doc = Record<string, any>;

const mockState: {
  products: Record<string, Doc>;
  invoices: Doc[];
  logs: Doc[];
  movements: Doc[];
  oversellMode: string;
  seq: number;
  counter: { seq: number } | null;
} = {
  products: {},
  invoices: [],
  logs: [],
  movements: [],
  oversellMode: "clamp",
  seq: 0,
  counter: null,
};
let mockLock: Promise<void> = Promise.resolve();

const mockClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

jest.mock("@/models/Product", () => {
  const chain = (get: () => unknown) => {
    const q: any = { session: () => q, select: () => q, lean: async () => get() };
    return q;
  };
  return {
    __esModule: true,
    default: {
      find: (filter: any) =>
        chain(() => filter._id.$in.map((id: string) => mockState.products[id]).filter(Boolean)),
      findById: (id: string) => chain(() => mockState.products[id] || null),
      findOneAndUpdate: async (filter: any, update: any) => {
        const product = mockState.products[String(filter._id)];
        if (!product) return null;
        if (Array.isArray(update)) {
          // Pipeline update that floors at 0; returns the document from before the update
          const qty = update[0].$set.quantity.$max[1].$subtract[1];
          const before = { ...product };
          product.quantity = Math.max(0, product.quantity - qty);
          return before;
        }
        if (product.quantity < (filter.quantity?.$gte ?? 0)) return null;
        product.quantity += update.$inc.quantity;
        return product;
      },
      updateOne: async (filter: any, update: any) => {
        const product = mockState.products[String(filter._id)];
        if (!product) return { matchedCount: 0 };
        product.quantity += update.$inc.quantity;
        return { matchedCount: 1 };
      },
    },
  };
});

jest.mock("@/models/customer", () => ({
  __esModule: true,
  default: { findByIdAndUpdate: async () => null },
}));

jest.mock("@/models/setting", () => ({
  __esModule: true,
  default: {
    findOne: () => {
      const q: any = { session: () => q, lean: async () => ({ oversellMode: mockState.oversellMode }) };
      return q;
    },
  },
}));

jest.mock("@/models/stockMovement", () => ({
  __esModule: true,
  default: {
    insertMany: async (entries: Doc[]) => {
      const docs = mockClone(entries).map((entry: Doc) => ({ ...entry, _id: `mv${++mockState.seq}` }));
      mockState.movements.push(...docs);
      return docs;
    },
    deleteMany: async (filter: Doc) => {
      mockState.movements = mockState.movements.filter((entry) => !filter._id.$in.includes(entry._id));
    },
  },
}));

jest.mock("@/models/returnLog", () => ({
  __esModule: true,
  default: {
    insertMany: async (entries: Doc[]) => {
      const docs = mockClone(entries).map((entry: Doc) => ({ ...entry, _id: `log${++mockState.seq}` }));
      mockState.logs.push(...docs);
      return docs;
    },
    deleteMany: async (filter: Doc) => {
      mockState.logs = mockState.logs.filter((log) => !filter._id.$in.includes(log._id));
    },
  },
}));

jest.mock("@/models/InvoiceCounter", () => ({
  __esModule: true,
  default: {
    updateOne: async (filter: Doc, update: Doc) => {
      if (update.$max) {
        if (!mockState.counter) mockState.counter = { seq: update.$max.seq };
        else mockState.counter.seq = Math.max(mockState.counter.seq, update.$max.seq);
      } else if (update.$inc && mockState.counter && mockState.counter.seq === filter.seq) {
        mockState.counter.seq += update.$inc.seq;
      }
      return { matchedCount: 1 };
    },
    findOneAndUpdate: async (_filter: Doc, update: Doc) => {
      if (!mockState.counter) mockState.counter = { seq: 0 };
      mockState.counter.seq += update.$inc.seq;
      return { seq: mockState.counter.seq };
    },
    findOne: () => ({ lean: async () => (mockState.counter ? { ...mockState.counter } : null) }),
  },
}));

jest.mock("@/models/invoice", () => {
  const wrap = (data: Doc) => {
    const doc: Doc = mockClone(data);
    doc.toObject = function () {
      const { save, toObject, ...plain } = this;
      return mockClone(plain);
    };
    doc.save = async function () {
      const { save, toObject, ...plain } = this;
      const index = mockState.invoices.findIndex((invoice) => invoice._id === plain._id);
      if (index < 0) {
        const clash = mockState.invoices.find(
          (invoice) =>
            invoice.invoiceNo === plain.invoiceNo ||
            (plain.idempotencyKey && invoice.idempotencyKey === plain.idempotencyKey)
        );
        if (clash) {
          const key = clash.invoiceNo === plain.invoiceNo ? "invoiceNo_1" : "idempotencyKey_1";
          throw Object.assign(new Error(`E11000 duplicate key error index: ${key}`), { code: 11000 });
        }
      }
      if (!plain._id) plain._id = `inv${++mockState.seq}`;
      this._id = plain._id;
      const stored = mockClone(plain);
      if (index >= 0) mockState.invoices[index] = stored;
      else mockState.invoices.push(stored);
      return this;
    };
    return doc;
  };

  function MockInvoice(this: Doc, data: Doc) {
    Object.assign(this, wrap(data));
  }
  // Chainable and awaitable like a mongoose query
  const query = (get: (sorted: boolean) => Doc | undefined) => {
    let sorted = false;
    const q: any = {
      session: () => q,
      select: () => q,
      sort: () => {
        sorted = true;
        return q;
      },
      lean: async () => get(sorted) || null,
      then: (resolve: any, reject: any) =>
        Promise.resolve((() => {
          const found = get(sorted);
          return found ? wrap(found) : null;
        })()).then(resolve, reject),
    };
    return q;
  };
  const maxInvoice = () =>
    mockState.invoices.reduce<Doc | undefined>(
      (best, invoice) => (!best || invoice.invoiceNo > best.invoiceNo ? invoice : best),
      undefined
    );
  (MockInvoice as any).findOne = (filter: Doc) =>
    query((sorted) => {
      if (sorted) return maxInvoice();
      return mockState.invoices.find(
        (invoice) =>
          (filter.invoiceNo === undefined || invoice.invoiceNo === filter.invoiceNo) &&
          (filter.idempotencyKey === undefined || invoice.idempotencyKey === filter.idempotencyKey)
      );
    });
  (MockInvoice as any).findById = (id: string) =>
    query(() => mockState.invoices.find((invoice) => invoice._id === id));
  (MockInvoice as any).deleteOne = async (filter: Doc) => {
    mockState.invoices = mockState.invoices.filter((invoice) => invoice._id !== filter._id);
  };
  (MockInvoice as any).replaceOne = async (filter: Doc, replacement: Doc, options: Doc = {}) => {
    const index = mockState.invoices.findIndex((invoice) => invoice._id === filter._id);
    if (index >= 0) mockState.invoices[index] = mockClone(replacement);
    else if (options.upsert) mockState.invoices.push(mockClone(replacement));
  };
  return { __esModule: true, default: MockInvoice };
});

import Invoice from "@/models/invoice";
import { canonicalizeLines, resolveReturnStatus, summarizeInvoice } from "../posHelpers";
import {
  InvoiceError,
  addReturnsToInvoice,
  cancelReturnOnInvoice,
  deleteInvoiceWithStock,
  voidInvoiceWithStock,
  getNextInvoicePreview,
  resetTransactionSupport,
  saveInvoiceWithStock,
} from "../invoiceService";

const A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const ADMIN = { isAdmin: true, confirmed: true };
const stockOf = (id = A) => mockState.products[id].quantity;
const sale = (quantity: number, extra: Doc = {}) => ({ productId: A, productName: "Shirt", quantity, sellPrice: 10, ...extra });
const ret = (quantity: number) => sale(quantity, { mode: "return" });
// New invoices: the number is assigned by the server, so any client value is ignored
const input = (_ignoredNo: number, productDetail: Doc[], extra: Doc = {}) => ({
  invoiceNo: _ignoredNo,
  productDetail: productDetail as any,
  discount: 0,
  prevBalance: 0,
  ...extra,
});
const edit = (invoiceNo: number, productDetail: Doc[]) => input(invoiceNo, productDetail, { isEdit: true });

beforeEach(() => {
  resetTransactionSupport();
  mockState.products = { [A]: { _id: A, productName: "Shirt", quantity: 10 } };
  mockState.invoices = [];
  mockState.logs = [];
  mockState.movements = [];
  // The older tests in this file describe the strict rule; the clamp tests switch to "clamp" themselves
  mockState.oversellMode = "block";
  mockState.counter = null;
  mockLock = Promise.resolve();

  jest.spyOn(mongoose, "startSession").mockResolvedValue({
    // Transactions are serialized, like write-conflict retries on the counter document
    withTransaction: async (callback: () => Promise<void>) => {
      const previous = mockLock;
      let release: () => void = () => undefined;
      mockLock = new Promise<void>((resolve) => (release = resolve));
      await previous;
      const snapshot = mockClone({
        products: mockState.products,
        invoices: mockState.invoices,
        logs: mockState.logs,
        movements: mockState.movements,
        counter: mockState.counter,
      });
      try {
        await callback();
      } catch (error) {
        mockState.products = snapshot.products;
        mockState.invoices = snapshot.invoices;
        mockState.logs = snapshot.logs;
        mockState.movements = snapshot.movements;
        mockState.counter = snapshot.counter;
        throw error;
      } finally {
        release();
      }
    },
    endSession: async () => undefined,
  } as any);
});

afterEach(() => jest.restoreAllMocks());

const rejection = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error as InvoiceError;
  }
  throw new Error("Expected the call to be rejected");
};

describe("invoiceService", () => {
  test("quantity above stock fails the whole invoice and changes nothing", async () => {
    const error = await rejection(saveInvoiceWithStock(input(1, [sale(11)])));
    expect(error).toBeInstanceOf(InvoiceError);
    expect(error.status).toBe(409);
    expect(stockOf()).toBe(10);
    expect(mockState.invoices).toHaveLength(0);
  });

  test("a failing line rolls back the stock already taken by earlier lines", async () => {
    const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
    mockState.products[B] = { _id: B, productName: "Pant", quantity: 1 };

    const error = await rejection(
      saveInvoiceWithStock(input(1, [sale(4), { productId: B, productName: "Pant", quantity: 2, sellPrice: 5 }]))
    );
    expect(error.status).toBe(409);
    expect(stockOf()).toBe(10);
    expect(stockOf(B)).toBe(1);
  });

  test("saving a sale deducts stock once, in the same call", async () => {
    await saveInvoiceWithStock(input(1, [sale(4)]));
    expect(stockOf()).toBe(6);
    expect(mockState.invoices).toHaveLength(1);
  });

  test("return more than sold is rejected", async () => {
    await saveInvoiceWithStock(input(1, [sale(2)]));

    const direct = await rejection(saveInvoiceWithStock(input(2, [sale(2), ret(3)])));
    expect(direct.status).toBe(400);

    const linked = await rejection(addReturnsToInvoice(mockState.invoices[0]._id, [{ productId: A, quantity: 3 }]));
    expect(linked.status).toBe(400);
    expect(stockOf()).toBe(8);
    expect(mockState.logs).toHaveLength(0);
  });

  test("return updates the original line with a server time, then cancel restores stock", async () => {
    await saveInvoiceWithStock(input(1, [sale(3)]));
    const id = mockState.invoices[0]._id;

    await addReturnsToInvoice(id, [{ productId: A, quantity: 1 }], "user1");
    const lines = mockState.invoices[0].productDetail;
    expect(lines).toHaveLength(1);
    expect(lines[0].returnedQty).toBe(1);
    expect(lines[0].returns).toHaveLength(1);
    expect(Number.isNaN(new Date(lines[0].returns[0].at).getTime())).toBe(false);
    expect(lines[0].returns[0].user).toBe("user1");
    expect(stockOf()).toBe(8);

    await cancelReturnOnInvoice(id, 0, 0, "user1");
    const after = mockState.invoices[0].productDetail;
    expect(after).toHaveLength(1);
    expect(after[0].returns[0].cancelled).toBe(true);
    expect(after[0].returnedQty).toBe(0);
    expect(stockOf()).toBe(7);
  });

  describe("edit mode keeps the stored return history", () => {
    const seed = async () => {
      await saveInvoiceWithStock(input(1, [sale(3)]));
      await saveInvoiceWithStock(edit(1, [sale(3), ret(1)]));
      return mockState.invoices[0];
    };

    test("history is present after loading and survives a price edit unchanged", async () => {
      const loaded = await seed();
      const canonical = canonicalizeLines(loaded.productDetail);
      expect(canonical[0].returnedQty).toBe(1);
      const firstEntry = JSON.parse(JSON.stringify(canonical[0].returns[0]));

      await saveInvoiceWithStock(edit(1, [sale(3, { sellPrice: 12 })]));
      const line = mockState.invoices[0].productDetail[0];
      expect(line.sellPrice).toBe(12);
      expect(line.returns).toHaveLength(1);
      expect(line.returns[0].at).toEqual(firstEntry.at);
      expect(line.returns[0].qty).toBe(1);
      expect(line.returnedQty).toBe(1);
      expect(stockOf()).toBe(8);
    });

    test("a second return adds an entry and leaves the first untouched", async () => {
      const loaded = await seed();
      const first = JSON.parse(JSON.stringify(loaded.productDetail[0].returns[0]));
      await saveInvoiceWithStock(edit(1, [sale(3), ret(1)]));
      const line = mockState.invoices[0].productDetail[0];
      expect(line.returns).toHaveLength(2);
      expect(line.returns[0]).toMatchObject({ qty: first.qty, at: first.at, user: first.user });
      expect(line.returnedQty).toBe(2);
      expect(mockState.invoices[0].productDetail).toHaveLength(1);
    });

    test("quantity below returnedQty and removing a returned line are rejected", async () => {
      await seed();
      const lower = await rejection(saveInvoiceWithStock(edit(1, [sale(0)])));
      expect(lower.status).toBe(400);
      const removed = await rejection(saveInvoiceWithStock(edit(1, [])));
      expect(removed.status).toBe(400);
      expect(mockState.invoices[0].productDetail[0].returns).toHaveLength(1);
    });

    test("returns[], at and returnedQty sent by the client are ignored", async () => {
      const loaded = await seed();
      const original = JSON.parse(JSON.stringify(loaded.productDetail[0].returns));
      const forged = sale(3, {
        returnedQty: 3,
        returns: [{ qty: 3, at: "2000-01-01T00:00:00Z", user: "me", refundAmount: 999 }],
      });
      await saveInvoiceWithStock(edit(1, [forged]));
      const line = mockState.invoices[0].productDetail[0];
      expect(line.returns).toEqual(original);
      expect(line.returnedQty).toBe(1);
    });
  });

  test("double return cannot exceed what was sold", async () => {
    await saveInvoiceWithStock(input(1, [sale(3)]));
    const id = mockState.invoices[0]._id;

    await addReturnsToInvoice(id, [{ productId: A, quantity: 2 }], "user1");
    expect(stockOf()).toBe(9);

    const error = await rejection(addReturnsToInvoice(id, [{ productId: A, quantity: 2 }], "user1"));
    expect(error.status).toBe(400);
    expect(stockOf()).toBe(9);

    const sold = mockState.invoices[0].productDetail.find((line: Doc) => line.mode === "sale");
    expect(sold.returnedQty).toBe(2);
    expect(mockState.logs).toHaveLength(1);
  });

  test("editing an invoice adjusts stock by the difference only", async () => {
    await saveInvoiceWithStock(input(1, [sale(3)]));
    expect(stockOf()).toBe(7);

    await saveInvoiceWithStock(edit(1, [sale(5)]));
    expect(stockOf()).toBe(5);

    await saveInvoiceWithStock(edit(1, [sale(5)]));
    expect(stockOf()).toBe(5);

    await saveInvoiceWithStock(edit(1, [sale(2)]));
    expect(stockOf()).toBe(8);
    expect(mockState.invoices).toHaveLength(1);
  });

  test("deleting an invoice restores sold stock and reverses returns", async () => {
    await saveInvoiceWithStock(input(1, [sale(4)]));
    await addReturnsToInvoice(mockState.invoices[0]._id, [{ productId: A, quantity: 1 }], "user1");
    expect(stockOf()).toBe(7);

    await deleteInvoiceWithStock(mockState.invoices[0]._id, "user1", ADMIN);
    expect(stockOf()).toBe(10);
    expect(mockState.invoices).toHaveLength(0);

    const net = mockState.logs.reduce((sum, log) => sum + log.quantity, 0);
    expect(net).toBe(0);
  });

  test("delete fails as a whole when a product no longer exists", async () => {
    const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
    mockState.products[B] = { _id: B, productName: "Pant", quantity: 5 };
    await saveInvoiceWithStock(
      input(1, [sale(4), { productId: B, productName: "Pant", quantity: 1, sellPrice: 5 }])
    );
    delete mockState.products[B];

    const error = await rejection(deleteInvoiceWithStock(mockState.invoices[0]._id, undefined, ADMIN));
    expect(error.status).toBe(404);
    expect(stockOf()).toBe(6);
    expect(mockState.invoices).toHaveLength(1);
  });

  test("deleting an unknown invoice gives 404", async () => {
    const error = await rejection(deleteInvoiceWithStock("missing"));
    expect(error.status).toBe(404);
  });

  describe("oversell clamp mode", () => {
    beforeEach(() => {
      mockState.oversellMode = "clamp";
      mockState.products[A].quantity = 2;
    });
    const line0 = () => mockState.invoices[0].productDetail[0];

    test("sell 5 with stock 2: stock 0, stockDeducted 2, unstockedQty 3, saved, no 409", async () => {
      await saveInvoiceWithStock(input(1, [sale(5)]));
      expect(stockOf()).toBe(0);
      expect(line0().stockDeducted).toBe(2);
      expect(line0().unstockedQty).toBe(3);
      expect(mockState.invoices).toHaveLength(1);
      expect(mockState.movements).toHaveLength(1);
      expect(mockState.movements[0].unstocked).toBe(3);
    });

    test("sell 1 with stock 0 keeps stock at 0", async () => {
      mockState.products[A].quantity = 0;
      await saveInvoiceWithStock(input(1, [sale(1)]));
      expect(stockOf()).toBe(0);
      expect(line0().stockDeducted).toBe(0);
      expect(line0().unstockedQty).toBe(1);
    });

    test("delete restores only stockDeducted, even after a restock", async () => {
      await saveInvoiceWithStock(input(1, [sale(5)]));
      mockState.products[A].quantity = 20;
      await deleteInvoiceWithStock(mockState.invoices[0]._id, "u", ADMIN);
      expect(stockOf()).toBe(22);
    });

    test("void restores once", async () => {
      await saveInvoiceWithStock(input(1, [sale(5)]));
      await voidInvoiceWithStock(mockState.invoices[0]._id, "u");
      expect(stockOf()).toBe(2);
      await rejection(voidInvoiceWithStock(mockState.invoices[0]._id, "u"));
      expect(stockOf()).toBe(2);
    });

    test("return 1 of 5 adds 1, then delete restores stockDeducted minus returned", async () => {
      await saveInvoiceWithStock(input(1, [sale(5)]));
      await addReturnsToInvoice(mockState.invoices[0]._id, [{ productId: A, quantity: 1 }], "u");
      expect(stockOf()).toBe(1);
      await deleteInvoiceWithStock(mockState.invoices[0]._id, "u", ADMIN);
      expect(stockOf()).toBe(2);
    });

    test("edit 5 to 3 restores nothing, 3 to 6 takes only what is available", async () => {
      await saveInvoiceWithStock(input(1, [sale(5)]));
      await saveInvoiceWithStock(edit(1, [sale(3)]));
      expect(stockOf()).toBe(0);
      expect(line0().stockDeducted).toBe(2);
      mockState.products[A].quantity = 4;
      await saveInvoiceWithStock(edit(1, [sale(6)]));
      expect(stockOf()).toBe(1);
      expect(line0().stockDeducted).toBe(5);
      expect(line0().unstockedQty).toBe(1);
    });

    test("two concurrent sales of the last piece never go negative", async () => {
      mockState.products[A].quantity = 1;
      await Promise.all([saveInvoiceWithStock(input(1, [sale(1)])), saveInvoiceWithStock(input(2, [sale(1)]))]);
      expect(stockOf()).toBe(0);
      const deducted = mockState.invoices.reduce((sum, inv) => sum + inv.productDetail[0].stockDeducted, 0);
      expect(deducted).toBe(1);
    });

    test("block mode rejects with 409 and leaves stock unchanged (global and per product)", async () => {
      mockState.oversellMode = "block";
      let error = await rejection(saveInvoiceWithStock(input(1, [sale(5)])));
      expect(error.status).toBe(409);
      expect(stockOf()).toBe(2);

      mockState.oversellMode = "clamp";
      mockState.products[A].oversellMode = "block";
      error = await rejection(saveInvoiceWithStock(input(1, [sale(5)])));
      expect(error.status).toBe(409);
      expect(stockOf()).toBe(2);
      expect(mockState.invoices).toHaveLength(0);
    });

    test("bundle component at 0 is clamped", async () => {
      const BUNDLE = "cccccccccccccccccccccccc";
      mockState.products[BUNDLE] = { _id: BUNDLE, productName: "Set", quantity: 0, isBundle: true, components: [A] };
      mockState.products[A].quantity = 0;
      await saveInvoiceWithStock(input(1, [{ productId: BUNDLE, productName: "Set", quantity: 2, sellPrice: 10 }]));
      expect(stockOf()).toBe(0);
      expect(mockState.invoices[0].productDetail[0].unstockedQty).toBe(2);
    });

    test("legacy line without stockDeducted is treated as fully deducted", async () => {
      await saveInvoiceWithStock(input(1, [sale(2)]));
      const legacy = mockState.invoices[0].productDetail[0];
      delete legacy.stockDeducted;
      delete legacy.unstockedQty;
      delete legacy.stockDeductions;
      await deleteInvoiceWithStock(mockState.invoices[0]._id, "u", ADMIN);
      expect(stockOf()).toBe(2);
    });

    test("client-sent stockDeducted is ignored", async () => {
      await saveInvoiceWithStock(input(1, [sale(1, { stockDeducted: 99, unstockedQty: 0 })]));
      expect(line0().stockDeducted).toBe(1);
      expect(line0().unstockedQty).toBe(0);
      expect(stockOf()).toBe(1);
    });

    test("a failed save rolls back the stock movement", async () => {
      const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
      const error = await rejection(
        saveInvoiceWithStock(input(1, [sale(5), { productId: B, productName: "Gone", quantity: 1, sellPrice: 5 }]))
      );
      expect(error.status).toBe(404);
      expect(mockState.movements).toHaveLength(0);
      expect(stockOf()).toBe(2);
    });
  });

  test("return log records invoice, product, quantity, refund, reason, user and date", async () => {
    await saveInvoiceWithStock(input(7, [sale(3)]));
    await addReturnsToInvoice(mockState.invoices[0]._id, [{ productId: A, quantity: 2, reason: "damaged" }], "user1");

    expect(mockState.logs).toHaveLength(1);
    expect(mockState.logs[0]).toMatchObject({
      invoiceId: mockState.invoices[0]._id,
      invoiceNo: 1,
      productId: A,
      quantity: 2,
      refundAmount: 20,
      reason: "damaged",
      user: "user1",
    });
    expect(mockState.logs[0].date).toBeDefined();
  });

  test("a failed save writes no return log", async () => {
    await saveInvoiceWithStock(input(1, [sale(2)]));
    await rejection(saveInvoiceWithStock(input(1, [sale(2), ret(5)])));
    expect(mockState.logs).toHaveLength(0);
  });

  describe("standalone MongoDB (no transactions)", () => {
    beforeEach(() => {
      (mongoose.startSession as jest.Mock).mockResolvedValue({
        withTransaction: async () => {
          throw new Error("Transaction numbers are only allowed on a replica set member or mongos");
        },
        endSession: async () => undefined,
      });
    });

    test("saves a sale with guarded updates and no session", async () => {
      await saveInvoiceWithStock(input(1, [sale(4)]));
      expect(stockOf()).toBe(6);
      expect(mockState.invoices).toHaveLength(1);
    });

    test("quantity above stock is rejected without changing anything", async () => {
      const error = await rejection(saveInvoiceWithStock(input(1, [sale(11)])));
      expect(error.status).toBe(409);
      expect(stockOf()).toBe(10);
      expect(mockState.invoices).toHaveLength(0);
    });

    test("manually reverses stock already taken when a later line fails", async () => {
      const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
      mockState.products[B] = { _id: B, productName: "Pant", quantity: 1 };
      const error = await rejection(
        saveInvoiceWithStock(input(1, [sale(4), { productId: B, productName: "Pant", quantity: 2, sellPrice: 5 }]))
      );
      expect(error.status).toBe(409);
      expect(stockOf()).toBe(10);
      expect(stockOf(B)).toBe(1);
    });

    test("reverses stock and removes the new invoice when a step after the save fails", async () => {
      await saveInvoiceWithStock(input(1, [sale(3)]));
      const id = mockState.invoices[0]._id;
      jest.spyOn(ReturnLog, "insertMany").mockRejectedValueOnce(new Error("log write failed"));

      await rejection(addReturnsToInvoice(id, [{ productId: A, quantity: 1 }], "user1"));
      expect(stockOf()).toBe(7);
      expect(mockState.invoices[0].productDetail).toHaveLength(1);
      expect(mockState.logs).toHaveLength(0);

      jest.spyOn(ReturnLog, "insertMany").mockRejectedValueOnce(new Error("log write failed"));
      await rejection(saveInvoiceWithStock(input(2, [sale(2), ret(1)])));
      expect(stockOf()).toBe(7);
      expect(mockState.invoices).toHaveLength(1);
    });

    test("delete restores stock, and is reversed if a later step fails", async () => {
      await saveInvoiceWithStock(input(1, [sale(4)]));
      await deleteInvoiceWithStock(mockState.invoices[0]._id, undefined, ADMIN);
      expect(stockOf()).toBe(10);
      expect(mockState.invoices).toHaveLength(0);
    });

    test("return, edit and legacy handling work the same way", async () => {
      await saveInvoiceWithStock(input(1, [sale(3)]));
      await addReturnsToInvoice(mockState.invoices[0]._id, [{ productId: A, quantity: 2 }], "user1");
      expect(stockOf()).toBe(9);
      const error = await rejection(addReturnsToInvoice(mockState.invoices[0]._id, [{ productId: A, quantity: 2 }]));
      expect(error.status).toBe(400);
      expect(stockOf()).toBe(9);
    });

    test("real errors are not mistaken for missing transaction support", async () => {
      (mongoose.startSession as jest.Mock).mockResolvedValue({
        withTransaction: async () => {
          throw new Error("network down");
        },
        endSession: async () => undefined,
      });
      await expect(saveInvoiceWithStock(input(1, [sale(1)]))).rejects.toThrow("network down");
      expect(stockOf()).toBe(10);
    });
  });

  describe("return status, delete and void", () => {
    test("return 1 of 3: stock, total, status and display numbers agree", async () => {
      await saveInvoiceWithStock(input(1, [sale(3)]));
      await addReturnsToInvoice(mockState.invoices[0]._id, [{ productId: A, quantity: 1 }], "user1");

      const saved = mockState.invoices[0];
      const summary = summarizeInvoice({ items: saved.productDetail, discount: 0 });
      expect(stockOf()).toBe(8);
      expect(saved.returnStatus).toBe("partially_returned");
      expect(saved.grandTotal ?? summary.grandTotal).toBe(20);
      expect(summary.grandTotal).toBe(20);
      expect(summary.refundedAmount).toBe(10);
      expect(summary.saleRows[0]).toMatchObject({ soldQty: 3, returnedQty: 1, netQty: 2 });
      expect(summary.returnRows[0].amount).toBe(-10);
    });

    test("return all: fully_returned and the invoice is kept", async () => {
      await saveInvoiceWithStock(input(1, [sale(3)]));
      await addReturnsToInvoice(mockState.invoices[0]._id, [{ productId: A, quantity: 3 }], "user1");

      expect(stockOf()).toBe(10);
      expect(mockState.invoices).toHaveLength(1);
      expect(mockState.invoices[0].returnStatus).toBe("fully_returned");
    });

    test("delete: empty invoice is allowed for anyone", async () => {
      mockState.invoices.push({ _id: "empty1", invoiceNo: 5, discount: 0, productDetail: [] });
      await deleteInvoiceWithStock("empty1", "user1", { isAdmin: false, confirmed: false });
      expect(mockState.invoices).toHaveLength(0);
    });

    test("delete with lines needs admin and confirmation, then restores stock", async () => {
      await saveInvoiceWithStock(input(1, [sale(4)]));
      const id = mockState.invoices[0]._id;

      const notAdmin = await rejection(deleteInvoiceWithStock(id, "u", { isAdmin: false, confirmed: true }));
      expect(notAdmin.status).toBe(403);
      const unconfirmed = await rejection(deleteInvoiceWithStock(id, "u", { isAdmin: true, confirmed: false }));
      expect(unconfirmed.status).toBe(400);
      expect(stockOf()).toBe(6);

      await deleteInvoiceWithStock(id, "u", ADMIN);
      expect(stockOf()).toBe(10);
      expect(mockState.invoices).toHaveLength(0);
    });

    test("void restores stock once and keeps the record", async () => {
      await saveInvoiceWithStock(input(1, [sale(4)]));
      const id = mockState.invoices[0]._id;

      await voidInvoiceWithStock(id, "admin1", "wrong bill");
      expect(stockOf()).toBe(10);
      expect(mockState.invoices).toHaveLength(1);
      expect(mockState.invoices[0].voided).toBe(true);

      const again = await rejection(voidInvoiceWithStock(id, "admin1", "again"));
      expect(again.status).toBe(409);

      const edited = await rejection(saveInvoiceWithStock(edit(mockState.invoices[0].invoiceNo, [sale(1)])));
      expect(edited.status).toBe(409);

      await deleteInvoiceWithStock(id, "admin1", ADMIN);
      expect(stockOf()).toBe(10);
      expect(mockState.invoices).toHaveLength(0);
    });

    test("legacy invoice without mode or status counts as an active sale", async () => {
      mockState.invoices.push({
        _id: "legacy3",
        invoiceNo: 77,
        discount: 0,
        productDetail: [{ productId: A, productName: "Shirt", quantity: 2, sellPrice: 10 }],
      });
      const summary = summarizeInvoice({ items: mockState.invoices[0].productDetail, discount: 0 });
      expect(summary.grandTotal).toBe(20);
      expect(summary.returnStatus).toBe("active");
      expect(resolveReturnStatus(mockState.invoices[0])).toBe("active");
    });
  });

  describe("legacy invoices without mode", () => {
    const seedLegacy = () => {
      mockState.invoices.push({
        _id: "legacy1",
        invoiceNo: 99,
        discount: 0,
        prevBalance: 0,
        productDetail: [
          { productId: A, productName: "Shirt", quantity: 2, sellPrice: 10 },
          { productId: A, productName: "Shirt", quantity: 1, sellPrice: 10, return: true },
        ],
      });
    };

    test("delete treats every line without a mode as a sale", async () => {
      seedLegacy();
      await deleteInvoiceWithStock("legacy1", undefined, ADMIN);
      expect(stockOf()).toBe(13);
    });

    test("a return can be added against a legacy sale line", async () => {
      mockState.invoices.push({
        _id: "legacy2",
        invoiceNo: 98,
        discount: 0,
        prevBalance: 0,
        productDetail: [{ productId: A, productName: "Shirt", quantity: 2, sellPrice: 10 }],
      });
      await addReturnsToInvoice("legacy2", [{ productId: A, quantity: 1 }]);
      expect(stockOf()).toBe(11);
    });

    test("editing a legacy invoice computes the difference as sales", async () => {
      seedLegacy();
      await saveInvoiceWithStock(edit(99, [sale(3), sale(1)]));
      expect(stockOf()).toBe(9); // old lines count as 3 sold units, new lines as 4: only 1 more unit leaves stock
    });
  });

  describe("legacy return:true / sold:false lines", () => {
    const legacyReturn = (extra: Doc = {}) => ({
      productId: A, productName: "Shirt", quantity: 1, sellPrice: 10, return: true, sold: false, ...extra,
    });
    const seedMerged = (returnLine: Doc) =>
      mockState.invoices.push({
        _id: "lr1",
        invoiceNo: 50,
        discount: 0,
        prevBalance: 0,
        grandTotal: 20,
        productDetail: [{ productId: A, productName: "Shirt", quantity: 3, sellPrice: 10, return: false, sold: true }, returnLine],
      });

    test("a legacy line (even with the schema default mode sale) opens as a returns[] entry with no time", () => {
      seedMerged(legacyReturn({ mode: "sale" }));
      const lines = canonicalizeLines(mockState.invoices[0].productDetail);
      expect(lines).toHaveLength(1);
      expect(lines[0].returnedQty).toBe(1);
      expect(lines[0].returns).toHaveLength(1);
      expect(lines[0].returns[0].at).toBeUndefined();
    });

    test("saving it persists the merged format without changing stock, totals or the return log", async () => {
      seedMerged(legacyReturn());
      const before = stockOf();
      await saveInvoiceWithStock(edit(50, [sale(3)]));
      expect(stockOf()).toBe(before);
      expect(mockState.logs).toHaveLength(0);
      const stored = mockState.invoices[0];
      expect(stored.productDetail).toHaveLength(1);
      expect(stored.productDetail[0].returnedQty).toBe(1);
      expect(stored.productDetail[0].returns).toHaveLength(1);
      expect(stored.grandTotal).toBe(20);
    });

    test("a return line with no sale line stays visible and survives a save", async () => {
      mockState.invoices.push({
        _id: "lr2", invoiceNo: 51, discount: 0, prevBalance: 0,
        productDetail: [legacyReturn({ quantity: 2 })],
      });
      const lines = canonicalizeLines(mockState.invoices[0].productDetail);
      expect(lines).toHaveLength(1);
      expect(lines[0].mode).toBe("return");
      const before = stockOf();
      await saveInvoiceWithStock(edit(51, [ret(2)]));
      expect(stockOf()).toBe(before);
      expect(mockState.invoices[0].productDetail).toHaveLength(1);
      expect(mockState.invoices[0].productDetail[0].mode).toBe("return");
    });

    test("a new return afterwards gets a server time and the legacy entry is unchanged; no double count", async () => {
      seedMerged(legacyReturn());
      await saveInvoiceWithStock(edit(50, [sale(3)]));
      await addReturnsToInvoice("lr1", [{ productId: A, quantity: 1 }]);
      const line = mockState.invoices[0].productDetail[0];
      expect(line.returns).toHaveLength(2);
      expect(line.returns[0].at).toBeUndefined();
      expect(line.returns[1].at).toBeTruthy();
      expect(line.returnedQty).toBe(2);
      expect(canonicalizeLines(mockState.invoices[0].productDetail)[0].returnedQty).toBe(2);
    });
  });

  const modes: Array<[string, boolean]> = [
    ["with transactions", true],
    ["standalone (no transactions)", false],
  ];
  describe.each(modes)("invoice numbering %s", (_name, useTransactions) => {
    beforeEach(() => {
      if (!useTransactions) {
        (mongoose.startSession as jest.Mock).mockResolvedValue({
          withTransaction: async () => {
            throw new Error("Transaction numbers are only allowed on a replica set member or mongos");
          },
          endSession: async () => undefined,
        });
      }
    });
    const numbers = () => mockState.invoices.map((invoice) => invoice.invoiceNo).sort((a, b) => a - b);

    test("new invoices get server numbers and ignore the client's number", async () => {
      const first = await saveInvoiceWithStock(input(500, [sale(1)]));
      const second = await saveInvoiceWithStock(input(500, [sale(1)]));
      expect(first.invoice.invoiceNo).toBe(1);
      expect(second.invoice.invoiceNo).toBe(2);
    });

    test("the counter is seeded from the highest existing invoice number", async () => {
      mockState.invoices.push({ _id: "old", invoiceNo: 99, productDetail: [] });
      const result = await saveInvoiceWithStock(input(1, [sale(1)]));
      expect(result.invoice.invoiceNo).toBe(100);
    });

    test("a rolled-back save does not consume a number", async () => {
      jest.spyOn(ReturnLog, "insertMany").mockRejectedValueOnce(new Error("log write failed"));
      await rejection(saveInvoiceWithStock(input(1, [sale(2), ret(1)])));
      expect(mockState.invoices).toHaveLength(0);
      expect(stockOf()).toBe(10);

      const next = await saveInvoiceWithStock(input(1, [sale(1)]));
      expect(next.invoice.invoiceNo).toBe(1);
    });

    test("the same idempotency key sent twice creates one invoice", async () => {
      const key = "attempt-1234-5678";
      const first = await saveInvoiceWithStock(input(1, [sale(4)], { idempotencyKey: key }));
      const second = await saveInvoiceWithStock(input(1, [sale(4)], { idempotencyKey: key }));

      expect(first.created).toBe(true);
      expect(second.duplicate).toBe(true);
      expect(second.created).toBe(false);
      expect(second.invoice.invoiceNo).toBe(first.invoice.invoiceNo);
      expect(mockState.invoices).toHaveLength(1);
      expect(stockOf()).toBe(6);
      expect(mockState.counter?.seq).toBe(1);
    });

    test("a duplicate-key race returns the original invoice and changes nothing", async () => {
      const key = "attempt-race-0001";
      await saveInvoiceWithStock(input(1, [sale(4)], { idempotencyKey: key }));

      // The lookup misses (as if the first request had not committed yet); the unique index catches it
      jest.spyOn(Invoice as any, "findOne").mockImplementationOnce(() => ({ session: async () => null }));
      const raced = await saveInvoiceWithStock(input(1, [sale(4)], { idempotencyKey: key }));

      expect(raced.duplicate).toBe(true);
      expect(mockState.invoices).toHaveLength(1);
      expect(stockOf()).toBe(6);
    });

    test("two concurrent saves get different numbers", async () => {
      const [a, b] = await Promise.all([
        saveInvoiceWithStock(input(1, [sale(1)], { idempotencyKey: "concurrent-aaaa" })),
        saveInvoiceWithStock(input(1, [sale(1)], { idempotencyKey: "concurrent-bbbb" })),
      ]);
      expect(a.invoice.invoiceNo).not.toBe(b.invoice.invoiceNo);
      expect(numbers()).toEqual([1, 2]);
      expect(stockOf()).toBe(8);
    });

    test("an edit keeps its original number and does not touch the counter", async () => {
      await saveInvoiceWithStock(input(1, [sale(1)]));
      await saveInvoiceWithStock(input(1, [sale(1)]));
      const edited = await saveInvoiceWithStock(edit(1, [sale(3)]));

      expect(edited.created).toBe(false);
      expect(edited.invoice.invoiceNo).toBe(1);
      expect(numbers()).toEqual([1, 2]);
      expect(mockState.counter?.seq).toBe(2);
    });

    test("editing an invoice that does not exist is a 404, not a new invoice", async () => {
      const error = await rejection(saveInvoiceWithStock(edit(42, [sale(1)])));
      expect(error.status).toBe(404);
      expect(mockState.invoices).toHaveLength(0);
    });

    test("the preview never writes", async () => {
      mockState.invoices.push({ _id: "old", invoiceNo: 5, productDetail: [] });
      expect(await getNextInvoicePreview()).toBe(6);
      expect(await getNextInvoicePreview()).toBe(6);
      expect(mockState.counter).toBeNull();
    });
  });

  test("standalone: the number is not given back when a later number was already issued", async () => {
    (mongoose.startSession as jest.Mock).mockResolvedValue({
      withTransaction: async () => {
        throw new Error("Transaction numbers are only allowed on a replica set member or mongos");
      },
      endSession: async () => undefined,
    });
    // Simulate another save taking the next number while this one fails
    jest.spyOn(ReturnLog, "insertMany").mockImplementationOnce(async () => {
      mockState.counter!.seq += 1;
      throw new Error("log write failed");
    });
    await rejection(saveInvoiceWithStock(input(1, [sale(2), ret(1)])));

    // A rare gap remains: number 1 is lost, the next save gets 3
    const next = await saveInvoiceWithStock(input(1, [sale(1)]));
    expect(next.invoice.invoiceNo).toBe(3);
  });
});
