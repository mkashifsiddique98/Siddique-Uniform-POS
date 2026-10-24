const { buildCustomerInvoiceLedger, deriveReceivedPayments } = require('../customerLedger');

describe('buildCustomerInvoiceLedger (wholesale customer)', () => {
  const sale = {
    id: 'invoice-1',
    customerType: 'wholesaler',
    date: '2026-02-01T10:00:00.000Z',
    reference: '1001',
    grandTotal: 100,
    prevBalance: 999,
    lines: [{ productName: 'Shirt', quantity: 2, sellPrice: 50, return: false }],
  };

  it('records a sale as a debit without double-counting prevBalance', () => {
    const result = buildCustomerInvoiceLedger([sale]);
    expect(result.rows[0].debit).toBe(100);
    expect(result.rows[0].balance).toBe(100);
    expect(result.totals.outstanding).toBe(100);
  });

  it('records flagged return lines as credits', () => {
    const result = buildCustomerInvoiceLedger([{
      ...sale,
      id: 'invoice-2',
      lines: [
        { productName: 'Shirt', quantity: 2, sellPrice: 50, return: false },
        { productName: 'Trouser', quantity: 1, sellPrice: 30, return: true },
      ],
    }]);
    expect(result.rows.map((row) => row.type)).toEqual(['sale', 'return']);
    expect(result.totals.netSales).toBe(70);
    expect(result.totals.payments).toBe(0);
  });

  it('keeps running balance continuous across pages and date boundaries', () => {
    const result = buildCustomerInvoiceLedger([
      sale,
      { ...sale, id: 'invoice-3', date: '2026-02-02T10:00:00.000Z', grandTotal: 25, lines: [{ productName: 'Cap', quantity: 1, sellPrice: 25 }] },
    ]);
    const firstPage = result.rows.slice(0, 1);
    const secondPage = result.rows.slice(1);
    expect(secondPage[0].balance).toBeCloseTo(firstPage[0].balance + secondPage[0].debit, 2);
    expect(result.rows.filter((row) => row.date >= '2026-02-02T00:00:00.000Z')).toHaveLength(1);
  });

  it('returns an empty ledger without inventing payments', () => {
    const result = buildCustomerInvoiceLedger([]);
    expect(result.rows).toEqual([]);
    expect(result.totals).toEqual({ sales: 0, returns: 0, netSales: 0, outstanding: 0, payments: 0 });
  });

  it('derives received payments only between consecutive invoices', () => {
    const payments = deriveReceivedPayments([
      { ...sale, id: 'i1', date: '2026-02-01T10:00:00.000Z', grandTotal: 100, prevBalance: 100 },
      { ...sale, id: 'i2', date: '2026-02-05T10:00:00.000Z', grandTotal: 50, prevBalance: 90 },
    ]);
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({ sourceId: 'i2', amount: 60, estimated: true });
  });

  it('includes only invoices with the exact wholesale customer type', () => {
    const result = buildCustomerInvoiceLedger([
      sale,
      { ...sale, id: 'retail-invoice', customerType: 'retail' },
      { ...sale, id: 'legacy-alias', customerType: 'wholesale' },
    ]);

    expect(result.rows.map((row) => row.sourceId)).toEqual(['invoice-1']);
  });

  it('does not treat a supplier purchase as wholesale customer activity', () => {
    const purchase = {
      id: 'purchase-1',
      date: '2026-02-01T10:00:00.000Z',
      reference: 'purchase-1',
      products: [{ productName: 'Shirt', quantity: 2, productCost: 50 }],
      isPaid: false,
      paidAmount: 0,
    };

    expect(buildCustomerInvoiceLedger([purchase]).rows).toEqual([]);
  });
});
