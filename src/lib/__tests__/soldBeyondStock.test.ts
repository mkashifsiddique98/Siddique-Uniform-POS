import { summarizeSoldBeyondStock } from "../soldBeyondStock";

const inv = (invoiceNo: number, unstockedQty: number, extra: Record<string, unknown> = {}) => ({
  invoiceNo,
  date: new Date("2024-01-0" + invoiceNo),
  productDetail: [{ productId: "p1", productName: "Shirt", quantity: 5, unstockedQty }],
  ...extra,
});

describe("summarizeSoldBeyondStock", () => {
  test("totals unstockedQty per product and lists invoice numbers", () => {
    const rows = summarizeSoldBeyondStock([inv(1, 3), inv(2, 2)] as any);
    expect(rows).toHaveLength(1);
    expect(rows[0].unstockedQty).toBe(5);
    expect(rows[0].invoiceNumbers).toEqual([1, 2]);
  });

  test("ignores lines with nothing beyond stock", () => {
    expect(summarizeSoldBeyondStock([inv(1, 0)] as any)).toHaveLength(0);
  });
});
