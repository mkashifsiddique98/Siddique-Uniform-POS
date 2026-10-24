const { buildSupplierLedger } = require('../wholesalerLedger');

describe('buildSupplierLedger', () => {
  const records = [
    {
      id: 'b',
      date: '2026-01-02T10:00:00.000Z',
      reference: 'P-2',
      products: [{ productName: 'Trouser', quantity: 2, productCost: 25.15 }],
      isPaid: true,
    },
    {
      id: 'a',
      date: '2026-01-01T10:00:00.000Z',
      reference: 'P-1',
      products: [{ productName: 'Shirt', quantity: 3, productCost: 10.1 }],
      isPaid: false,
    },
  ];

  it('keeps purchases as debits and paid purchase flags as credits', () => {
    const result = buildSupplierLedger(records);
    expect(result.rows.map((row) => row.type)).toEqual(['purchase', 'purchase', 'payment']);
    expect(result.totals).toEqual({ purchased: 80.6, paid: 50.3, outstanding: 30.3 });
  });

  it('shows a purchase in the ledger as a debit with its products', () => {
    const result = buildSupplierLedger([records[1]]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ type: 'purchase', sourceId: 'a', debit: 30.3, summary: 'Shirt x3' });
  });

  it('reduces the balance with partial paid amounts and later payments to the supplier', () => {
    const result = buildSupplierLedger(
      [{ ...records[1], paidAmount: 10 }],
      0,
      [{ id: 'pay1', date: '2026-01-05T10:00:00.000Z', amount: 5.3, note: 'cash' }]
    );
    expect(result.rows.map((row) => row.type)).toEqual(['purchase', 'payment', 'payment']);
    expect(result.rows.at(-1)).toMatchObject({ summary: 'cash', credit: 5.3 });
    expect(result.totals).toEqual({ purchased: 30.3, paid: 15.3, outstanding: 15 });
  });

  it('preserves an opening balance and running balance', () => {
    const result = buildSupplierLedger(records, 10);
    expect(result.rows[0].balance).toBe(40.3);
    expect(result.rows.at(-1)?.balance).toBe(40.3);
  });

  it('does not create rows for an empty supplier', () => {
    const result = buildSupplierLedger([], 12.5);
    expect(result.rows).toEqual([]);
    expect(result.totals.outstanding).toBe(12.5);
  });

  it('keeps page two continuous with page one', () => {
    const rows = buildSupplierLedger(records).rows;
    const pageOne = rows.slice(0, 2);
    const pageTwo = rows.slice(2, 4);
    expect(pageTwo[0].balance).toBeCloseTo(pageOne.at(-1).balance - pageTwo[0].credit + pageTwo[0].debit, 2);
  });

  it('allows inclusive date-boundary filtering without changing balances', () => {
    const rows = buildSupplierLedger(records).rows;
    const from = new Date('2026-01-02T10:00:00.000Z').getTime();
    const to = new Date('2026-01-02T10:00:00.000Z').getTime();
    const filtered = rows.filter((row) => new Date(row.date).getTime() >= from && new Date(row.date).getTime() <= to);
    expect(filtered).toHaveLength(2);
    expect(filtered.at(-1).balance).toBe(30.3);
  });
});