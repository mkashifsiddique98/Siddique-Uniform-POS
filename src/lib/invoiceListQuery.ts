export const MAX_INVOICE_PAGE_SIZE = 500;

export type InvoiceListQuery =
  | { ok: false; error: string }
  | {
      ok: true;
      filter: Record<string, unknown>;
      // Set only when the caller asked for it; no params means the old "everything" behaviour
      sort?: Record<string, 1 | -1>;
      paging?: { page: number; limit: number; skip: number };
    };

function parseDate(value: string | null): Date | null | "invalid" {
  if (value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

function parsePositiveInt(value: string | null): number | null | "invalid" {
  if (value === null || value === "") return null;
  if (!/^\d+$/.test(value)) return "invalid";
  const n = Number(value);
  return n >= 1 ? n : "invalid";
}

// Optional GET /api/invoice params: `from` (inclusive) and `to` (exclusive) on invoiceDate, and `page`/`limit`.
// With none of them the result is the same as before: all invoices, unsorted.
export function buildInvoiceListQuery(params: URLSearchParams): InvoiceListQuery {
  const from = parseDate(params.get("from"));
  const to = parseDate(params.get("to"));
  const page = parsePositiveInt(params.get("page"));
  const limit = parsePositiveInt(params.get("limit"));

  if (from === "invalid" || to === "invalid") return { ok: false, error: "Invalid from/to date" };
  if (page === "invalid" || limit === "invalid") return { ok: false, error: "Invalid page/limit" };

  const filter: Record<string, unknown> = {};
  if (from || to) {
    filter.invoiceDate = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lt: to } : {}),
    };
  }

  if (page === null && limit === null) {
    return from || to ? { ok: true, filter, sort: { _id: 1 } } : { ok: true, filter };
  }

  const safeLimit = Math.min(limit ?? 50, MAX_INVOICE_PAGE_SIZE);
  const safePage = page ?? 1;
  return {
    ok: true,
    filter,
    sort: { _id: 1 },
    paging: { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit },
  };
}
