// Wholesale CUSTOMER ledger: a Customer with type "wholesale" who buys from the shop.
// Built from Invoice records only. Supplier (Wholesaler) data lives in wholesalerLedger.js.
const cents = (value) => Math.round((Number.isFinite(value) ? value : 0) * 100);
const rupees = (value) => cents(value) / 100;

function invoiceLineValue(line) {
  return Math.round(Number(line.sellPrice || 0) * Number(line.quantity || 0) * 100) / 100;
}

function sortInvoices(records) {
  return [...records].sort((left, right) => {
    const dateDifference = new Date(left.date).getTime() - new Date(right.date).getTime();
    return dateDifference || left.id.localeCompare(right.id);
  });
}

function splitInvoice(invoice) {
  const returnLines = invoice.lines.filter((line) => line.return === true);
  const saleLines = invoice.lines.filter((line) => line.return !== true);
  const lineTotal = (lines) => lines.reduce((sum, line) => sum + invoiceLineValue(line), 0);
  return {
    saleValue: returnLines.length === 0 ? Number(invoice.grandTotal || 0) : lineTotal(saleLines),
    returnValue: lineTotal(returnLines),
  };
}

function buildCustomerInvoiceLedger(records, openingBalance = 0) {
  const sorted = sortInvoices(records.filter((invoice) => invoice.customerType === "wholesaler"));
  let balanceCents = cents(openingBalance);
  let salesCents = 0;
  let returnsCents = 0;
  const rows = [];

  for (const invoice of sorted) {
    const { saleValue, returnValue } = splitInvoice(invoice);
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

// Invoices do not store the amount received. Invoice.prevBalance is the balance left AFTER that
// invoice, so the payment between two consecutive invoices is:
//   previous remaining + this invoice's net value - this remaining.
// The first invoice has no known starting balance, so no payment is inferred for it.
function deriveReceivedPayments(records) {
  const payments = [];
  let previousRemaining = null;
  for (const invoice of sortInvoices(records.filter((record) => record.customerType === "wholesaler"))) {
    const { saleValue, returnValue } = splitInvoice(invoice);
    const remaining = Number(invoice.prevBalance || 0);
    if (previousRemaining !== null) {
      const received = rupees(previousRemaining + saleValue - returnValue - remaining);
      if (received > 0) {
        payments.push({
          date: new Date(invoice.date).toISOString(),
          reference: String(invoice.reference),
          amount: received,
          sourceId: String(invoice.id),
          estimated: true,
        });
      }
    }
    previousRemaining = remaining;
  }
  return payments;
}

module.exports = { buildCustomerInvoiceLedger, deriveReceivedPayments };
