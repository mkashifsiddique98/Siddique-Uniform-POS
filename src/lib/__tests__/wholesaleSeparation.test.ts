/** @jest-environment node */
// A Supplier (Wholesaler) and a Wholesale Customer are different entities:
// purchases feed the supplier ledger, invoices feed the customer page - never the other way round.
const mockWholesalerId = "64b000000000000000000001";
const mockCustomerId = "64b000000000000000000002";

const mockChain = (rows: unknown) => {
  const chain: any = { sort: () => chain, select: () => chain, lean: async () => rows };
  return chain;
};

const mockPurchaseFind = jest.fn();
const mockInvoiceFind = jest.fn();

jest.mock("@/utils/connectDB", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@/lib/auth", () => ({ requireAuth: jest.fn(async () => ({ ok: true, user: { userId: "u1", role: "admin" } })) }));
jest.mock("@/models/wholesaler", () => ({
  __esModule: true,
  default: { findById: () => ({ lean: async () => ({ _id: "64b000000000000000000001", name: "Supplier Co", phone: "0300", location: "Market", paymentStatus: "Pending", pendingBalance: 70 }) }) },
}));
jest.mock("@/models/purchase", () => ({
  __esModule: true,
  default: {
    find: (...args: unknown[]) => {
      mockPurchaseFind(...args);
      return mockChain([
        { _id: "p1", createdAt: "2026-03-01T10:00:00.000Z", isPaid: false, paidAmount: 30, products: [{ productName: "Shirt", quantity: 10, productCost: 10 }] },
      ]);
    },
  },
}));
jest.mock("@/models/wholesalerPayment", () => ({ __esModule: true, default: { find: () => mockChain([]) } }));
jest.mock("@/models/invoice", () => ({
  __esModule: true,
  default: {
    find: (...args: unknown[]) => {
      mockInvoiceFind(...args);
      return mockChain([
        { _id: "inv1", invoiceNo: 1001, invoiceDate: "2026-03-02T10:00:00.000Z", grandTotal: 500, prevBalance: 200, status: "Pending", customer: { _id: mockCustomerId, customerName: "Big School Store", type: "wholesaler", prevBalance: 200 }, productDetail: [{ productName: "Blazer", quantity: 1, sellPrice: 500 }] },
      ]);
    },
  },
}));

import { GET as supplierDetail } from "@/app/api/wholesalers/[id]/route";
import { GET as customerDetail } from "@/app/api/customer/wholesale/[id]/route";
import { buildCustomerInvoiceLedger } from "@/lib/customerLedger";
import { buildSupplierLedger } from "@/lib/wholesalerLedger";

describe("supplier vs wholesale customer separation", () => {
  beforeEach(() => {
    mockPurchaseFind.mockClear();
    mockInvoiceFind.mockClear();
  });

  it("shows a purchase in the supplier ledger and never touches invoices", async () => {
    const response = await supplierDetail(new Request("http://x"), { params: { id: mockWholesalerId } });
    const body = await response.json();

    expect(mockInvoiceFind).not.toHaveBeenCalled();
    expect(body.purchases).toHaveLength(1);
    expect(body.purchases[0]).toMatchObject({ id: "p1", total: 100, paidAtPurchase: 30 });
    expect(body.totals).toMatchObject({ purchased: 100, paid: 30, pendingBalance: 70 });
    expect(JSON.stringify(body)).not.toMatch(/Blazer|1001/);
  });

  it("shows a wholesale customer's invoice on the customer page and not the purchases", async () => {
    const response = await customerDetail(new Request("http://x"), { params: { id: mockCustomerId } });
    const body = await response.json();

    expect(mockPurchaseFind).not.toHaveBeenCalled();
    expect(body.invoices).toHaveLength(1);
    expect(body.invoices[0]).toMatchObject({ invoiceNo: "1001", total: 500 });
    expect(body.profile.prevBalance).toBe(200);
    expect(JSON.stringify(body)).not.toMatch(/Shirt|Supplier Co/);
  });

  it("queries invoices by customer id", async () => {
    await customerDetail(new Request("http://x"), { params: { id: mockCustomerId } });
    const filter = mockInvoiceFind.mock.calls[0][0];
    expect(String(filter["customer._id"])).toBe(mockCustomerId);
    expect(filter["customer.type"]).toBe("wholesaler");
    expect(filter.voided).toEqual({ $ne: true });
  });

  it("puts a wholesale-type invoice in only the wholesale customer ledger", () => {
    const invoice = {
      id: "invoice-wholesale",
      customerType: "wholesaler",
      date: "2026-03-02T10:00:00.000Z",
      reference: "1001",
      grandTotal: 500,
      lines: [{ productName: "Blazer", quantity: 1, sellPrice: 500 }],
    };

    const customerLedger = buildCustomerInvoiceLedger([invoice]);
    const supplierLedger = buildSupplierLedger([]);

    expect(customerLedger.rows.map((row: { sourceId: string }) => row.sourceId)).toEqual(["invoice-wholesale"]);
    expect(supplierLedger.rows).toEqual([]);
  });

  it("puts a purchase in only the supplier ledger", () => {
    const purchase = {
      id: "purchase-only",
      date: "2026-03-01T10:00:00.000Z",
      reference: "purchase-only",
      products: [{ productName: "Shirt", quantity: 2, productCost: 50 }],
      isPaid: false,
      paidAmount: 0,
    };

    const supplierLedger = buildSupplierLedger([purchase]);
    const customerLedger = buildCustomerInvoiceLedger([purchase]);

    expect(supplierLedger.rows.map((row: { sourceId: string }) => row.sourceId)).toEqual(["purchase-only"]);
    expect(customerLedger.rows).toEqual([]);
  });

  it("excludes a non-wholesale invoice from both ledgers", () => {
    const invoice = {
      id: "retail-invoice",
      customerType: "retail",
      date: "2026-03-02T10:00:00.000Z",
      reference: "1002",
      grandTotal: 500,
      lines: [{ productName: "Blazer", quantity: 1, sellPrice: 500 }],
    };

    expect(buildCustomerInvoiceLedger([invoice]).rows).toEqual([]);
    expect(buildSupplierLedger([]).rows).toEqual([]);
  });
});
