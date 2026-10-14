const cents = (value) => Math.round((Number.isFinite(value) ? value : 0) * 100);
const rupees = (value) => cents(value) / 100;

function purchaseTotal(purchase) {
  return rupees(
    purchase.products.reduce(
      (sum, product) => sum + cents(Number(product.productCost || 0) * Number(product.quantity || 0)) / 100,
      0
    )
  );
}

function buildSupplierLedger(records, openingBalance = 0) {
  const sorted = [...records].sort((left, right) => {
    const dateDifference = new Date(left.date).getTime() - new Date(right.date).getTime();
    return dateDifference || left.id.localeCompare(right.id);
  });

  let balanceCents = cents(openingBalance);
  let purchasedCents = 0;
  let paidCents = 0;
  const rows = [];

  for (const purchase of sorted) {
    const total = purchaseTotal(purchase);
    const totalCents = cents(total);
    const summary = purchase.products
      .slice(0, 3)
      .map((product) => `${product.productName || "Archived product"} x${Number(product.quantity || 0)}`)
      .join(", ");

    balanceCents += totalCents;
    purchasedCents += totalCents;
    rows.push({
      date: new Date(purchase.date).toISOString(),
      type: "purchase",
      reference: purchase.reference,
      summary: summary || "No product details",
      debit: total,
      credit: 0,
      balance: rupees(balanceCents / 100),
      sourceId: purchase.id,
    });

    if (purchase.isPaid && totalCents > 0) {
      balanceCents -= totalCents;
      paidCents += totalCents;
      rows.push({
        date: new Date(purchase.date).toISOString(),
        type: "payment",
        reference: purchase.reference,
        summary: "Recorded as paid on the purchase",
        debit: 0,
        credit: total,
        balance: rupees(balanceCents / 100),
        sourceId: purchase.id,
      });
    }
  }

  return {
    rows,
    totals: {
      purchased: rupees(purchasedCents / 100),
      paid: rupees(paidCents / 100),
      outstanding: rupees(balanceCents / 100),
    },
  };
}

module.exports = { buildSupplierLedger, purchaseTotal };

function invoiceLineValue(line) {
  return Math.round(Number(line.sellPrice || 0) * Number(line.quantity || 0) * 100) / 100;
}

function buildCustomerInvoiceLedger(records, openingBalance = 0) {
  const sorted = [...records].sort((left, right) => {
    const dateDifference = new Date(left.date).getTime() - new Date(right.date).getTime();
    return dateDifference || left.id.localeCompare(right.id);
  });
  let balanceCents = cents(openingBalance);
  let salesCents = 0;
  let returnsCents = 0;
  const rows = [];

  for (const invoice of sorted) {
    const returnLines = invoice.lines.filter((line) => line.return === true);
    const saleLines = invoice.lines.filter((line) => line.return !== true);
    const lineTotal = (lines) => lines.reduce((sum, line) => sum + invoiceLineValue(line), 0);
    const saleValue = returnLines.length === 0 ? Number(invoice.grandTotal || 0) : lineTotal(saleLines);
    const returnValue = lineTotal(returnLines);
    const summary = invoice.lines.slice(0, 3)
      .map((line) => `${line.productName || "Archived product"} x${Number(line.quantity || 0)}`)
      .join(", ");

    if (saleValue > 0) {
      const debit = rupees(saleValue);
      balanceCents += cents(debit);
      salesCents += cents(debit);
      rows.push({
        date: new Date(invoice.date).toISOString(),
        type: "sale",
        reference: String(invoice.reference),
        summary: summary || "No product details",
        debit,
        credit: 0,
        balance: rupees(balanceCents / 100),
        sourceId: String(invoice.id),
      });
    }

    if (returnValue > 0) {
      const credit = rupees(returnValue);
      balanceCents -= cents(credit);
      returnsCents += cents(credit);
      rows.push({
        date: new Date(invoice.date).toISOString(),
        type: "return",
        reference: String(invoice.reference),
        summary: `Return: ${summary || "No product details"}`,
        debit: 0,
        credit,
        balance: rupees(balanceCents / 100),
        sourceId: String(invoice.id),
      });
    }
  }

  return {
    rows,
    totals: {
      sales: rupees(salesCents / 100),
      returns: rupees(returnsCents / 100),
      netSales: rupees((salesCents - returnsCents) / 100),
      outstanding: rupees(balanceCents / 100),
      payments: 0,
    },
  };
}

module.exports.buildCustomerInvoiceLedger = buildCustomerInvoiceLedger;