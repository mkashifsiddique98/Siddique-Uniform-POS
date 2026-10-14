const { buildCustomerInvoiceLedger } = require('../wholesalerLedger');

describe('buildCustomerInvoiceLedger', () => {
  const sale = {
    id: 'invoice-1',
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
});
