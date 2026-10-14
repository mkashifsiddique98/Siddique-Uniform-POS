export interface SoldBeyondStockRow {
  productId: string;
  productName: string;
  unstockedQty: number;
  invoiceNumbers: number[];
  lastDate?: string;
}

// "Sold beyond stock": units that were sold while the shelf count was too low, per product.
// Void invoices are ignored. Computed from the invoices, so deleted or edited invoices drop out by themselves.
export function summarizeSoldBeyondStock(invoices: any[]): SoldBeyondStockRow[] {
  const rows = new Map<string, SoldBeyondStockRow>();

  for (const invoice of invoices) {
    if (invoice.voided) continue;
    for (const line of invoice.productDetail || []) {
      const unstocked = Number(line.unstockedQty) || 0;
      if (unstocked <= 0 || !line.productId) continue;
      const key = String(line.productId);
      const row: SoldBeyondStockRow = rows.get(key) || {
        productId: key,
        productName: line.productName,
        unstockedQty: 0,
        invoiceNumbers: [],
      };
      row.unstockedQty += unstocked;
      if (!row.invoiceNumbers.includes(invoice.invoiceNo)) row.invoiceNumbers.push(invoice.invoiceNo);
      const date = invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString() : undefined;
      if (date && (!row.lastDate || date > row.lastDate)) row.lastDate = date;
      rows.set(key, row);
    }
  }

  return Array.from(rows.values()).sort((a, b) => b.unstockedQty - a.unstockedQty);
}
