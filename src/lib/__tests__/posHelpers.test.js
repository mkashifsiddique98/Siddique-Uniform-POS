const {
  calculateInvoiceTotals,
  sortStockBatch,
  resolveItemKey,
  resolveMode,
  normalizeInvoiceForRead,
  canonicalizeLines,
} = require('../posHelpers');

describe('posHelpers', () => {
  test('calculateInvoiceTotals applies return values before discount', () => {
    const totals = calculateInvoiceTotals({
      items: [
        { quantity: 3, sellPrice: 50 },
        { quantity: 2, sellPrice: 20, mode: 'return' },
      ],
      discount: 10,
    });

    expect(totals).toMatchObject({
      subtotal: 110,
      discount: 10,
      grandTotal: 100,
    });
  });

  test('sortStockBatch prioritizes returns before sales', () => {
    const sorted = sortStockBatch([
      { quantity: 1, sellPrice: 30 },
      { quantity: 2, sellPrice: 15, mode: 'return' },
    ]);

    expect(sorted[0].mode).toBe('return');
  });

  test('resolveItemKey falls back to productId and productName values', () => {
    expect(resolveItemKey({ productId: 'abc123' })).toBe('abc123');
    expect(resolveItemKey({ productName: 'Blue Polo' })).toBe('Blue Polo');
  });

  test('resolveMode treats return items consistently', () => {
    expect(resolveMode({ mode: 'return' })).toBe('return');
    expect(resolveMode({ return: true })).toBe('sale');
    expect(resolveMode({ sellPrice: 20 })).toBe('sale');
  });

  test('legacy lines without a mode are always sales', () => {
    expect(resolveMode({})).toBe('sale');
    expect(resolveMode(undefined)).toBe('sale');
    expect(resolveMode({ mode: '' })).toBe('sale');
    const totals = calculateInvoiceTotals({
      items: [{ quantity: 2, sellPrice: 50 }, { quantity: 1, sellPrice: 30, return: true }],
    });
    expect(totals.grandTotal).toBe(130);
  });

  describe('legacy return lines on read', () => {
    const sale = { productId: 'p1', productName: 'Shirt', quantity: 3, sellPrice: 10, mode: 'sale', sold: true, return: false };
    const legacy = { productId: 'p1', productName: 'Shirt', quantity: 1, sellPrice: 10, mode: 'sale', sold: false, return: true };

    test('return:true + sold:false is a return even when mode defaulted to sale', () => {
      expect(resolveMode({ ...legacy, mode: undefined })).toBe('return');
    });

    test('normalizeInvoiceForRead merges the line, has no time, and is idempotent', () => {
      const read = normalizeInvoiceForRead({ productDetail: [sale, legacy] });
      expect(read.productDetail).toHaveLength(1);
      expect(read.productDetail[0].returnedQty).toBe(1);
      expect(read.productDetail[0].returns[0].at).toBeUndefined();
      expect(read.returnStatus).toBe('partially_returned');
      expect(canonicalizeLines(read.productDetail)[0].returnedQty).toBe(1);
    });

    test('a legacy line next to an existing returns[] entry is not counted twice', () => {
      const withEntry = { ...sale, quantity: 2, returns: [{ qty: 2, at: '2024-01-01T00:00:00.000Z' }] };
      const lines = canonicalizeLines([withEntry, legacy]);
      expect(lines[0].returnedQty).toBeLessThanOrEqual(2);
    });
  });
});

