// Supplier (Wholesaler) ledger. Built ONLY from Purchase records and payments we make to the supplier.
// Customer invoices, sales and returns belong to customerLedger.js.
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

// Amount settled at purchase time: everything when flagged paid, otherwise the recorded partial amount
function purchasePaidCents(purchase, totalCents) {
  if (purchase.isPaid) return totalCents;
  return Math.min(totalCents, Math.max(0, cents(Number(purchase.paidAmount || 0))));
}

function buildSupplierLedger(records, openingBalance = 0, payments = []) {
  const events = [
    ...records.map((purchase) => ({ kind: "purchase", date: purchase.date, id: purchase.id, purchase })),
    ...payments.map((payment) => ({ kind: "supplierPayment", date: payment.date, id: payment.id, payment })),
  ].sort((left, right) => {
    const dateDifference = new Date(left.date).getTime() - new Date(right.date).getTime();
    if (dateDifference) return dateDifference;
    if (left.kind !== right.kind) return left.kind === "purchase" ? -1 : 1;
    return String(left.id).localeCompare(String(right.id));
  });

  let balanceCents = cents(openingBalance);
  let purchasedCents = 0;
  let paidCents = 0;
  const rows = [];

  for (const event of events) {
    if (event.kind === "supplierPayment") {
      const credit = rupees(event.payment.amount);
      balanceCents -= cents(credit);
      paidCents += cents(credit);
      rows.push({
        date: new Date(event.payment.date).toISOString(),
        type: "payment",
        reference: event.payment.reference || `PAY-${String(event.id).slice(-6)}`,
        summary: event.payment.note || "Payment to supplier",
        debit: 0,
        credit,
        balance: rupees(balanceCents / 100),
        sourceId: String(event.id),
      });
      continue;
    }

    const purchase = event.purchase;
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

    const settledCents = purchasePaidCents(purchase, totalCents);
    if (settledCents > 0) {
      balanceCents -= settledCents;
      paidCents += settledCents;
      rows.push({
        date: new Date(purchase.date).toISOString(),
        type: "payment",
        reference: purchase.reference,
        summary: purchase.isPaid ? "Recorded as paid on the purchase" : "Paid at purchase time",
        debit: 0,
        credit: rupees(settledCents / 100),
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
