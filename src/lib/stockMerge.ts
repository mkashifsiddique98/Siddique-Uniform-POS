export type StockRow = { _id: string; quantity: number; oversellMode?: string };

type StockItem = { _id?: unknown; quantity?: number; oversellMode?: string };

// Applies stock rows to the product list. Only products whose quantity or oversell mode changed get a new
// object, and the same array is returned when nothing changed (so React does not re-render).
// structureChanged means products were added or removed, which stock rows alone cannot express.
export function applyStockRows<T extends StockItem>(
  items: T[],
  rows: StockRow[]
): { items: T[]; structureChanged: boolean } {
  const byId = new Map(rows.map((row) => [String(row._id), row]));
  const structureChanged =
    byId.size !== items.length || items.some((item) => !byId.has(String(item._id)));
  if (structureChanged) return { items, structureChanged };

  let changed = false;
  const next = items.map((item) => {
    const row = byId.get(String(item._id))!;
    if (item.quantity === row.quantity && item.oversellMode === row.oversellMode) return item;
    changed = true;
    return { ...item, quantity: row.quantity, oversellMode: row.oversellMode };
  });
  return { items: changed ? next : items, structureChanged: false };
}
