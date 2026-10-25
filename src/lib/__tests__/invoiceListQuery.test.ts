import { buildInvoiceListQuery, MAX_INVOICE_PAGE_SIZE } from "../invoiceListQuery";

const q = (s: string) => buildInvoiceListQuery(new URLSearchParams(s));

describe("buildInvoiceListQuery", () => {
  it("keeps the old behaviour with no params", () => {
    expect(q("")).toEqual({ ok: true, filter: {} });
  });

  it("filters a day with from inclusive and to exclusive", () => {
    const r: any = q("from=2025-01-02T00:00:00.000Z&to=2025-01-03T00:00:00.000Z");
    expect(r.ok).toBe(true);
    expect(r.filter.invoiceDate.$gte).toEqual(new Date("2025-01-02T00:00:00.000Z"));
    expect(r.filter.invoiceDate.$lt).toEqual(new Date("2025-01-03T00:00:00.000Z"));
    expect(r.paging).toBeUndefined();
  });

  it("pages and clamps the limit", () => {
    const r: any = q(`page=3&limit=${MAX_INVOICE_PAGE_SIZE + 100}`);
    expect(r.paging).toEqual({ page: 3, limit: MAX_INVOICE_PAGE_SIZE, skip: 2 * MAX_INVOICE_PAGE_SIZE });
    expect((q("page=2") as any).paging).toEqual({ page: 2, limit: 50, skip: 50 });
  });

  it("rejects bad input", () => {
    expect(q("from=nope").ok).toBe(false);
    expect(q("page=0").ok).toBe(false);
    expect(q("limit=-5").ok).toBe(false);
  });
});
