const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// The single rule for line type. A line is a return when its mode is "return", or when it is an old
// separate return line (return:true and sold:false). Old lines never had a mode, and the schema used to
// default it to "sale" when they were read, so the flags are the only reliable signal.
// Everything else, including old lines without a mode, is a sale.
const resolveMode = (item = {}) => {
  if (String(item.mode || '').toLowerCase() === 'return') return 'return';
  return item.return === true && item.sold === false ? 'return' : 'sale';
};

const resolveItemKey = (item = {}) => {
  if (item.productId) return String(item.productId);
  if (item._id) return String(item._id);
  return String(item.productName || 'unknown');
};

function calculateLineTotal(item = {}) {
  const quantity = Math.max(0, toNumber(item.quantity, 0));
  const price = Math.max(0, toNumber(item.sellPrice, 0));
  return quantity * price;
}

// Returned quantity of a sale line: always the sum of its non-cancelled returns, never a stored number.
const computeReturnedQty = (line = {}) =>
  (Array.isArray(line.returns) ? line.returns : []).reduce(
    (sum, entry) => (entry && !entry.cancelled ? sum + Math.max(0, toNumber(entry.qty, 0)) : sum),
    0
  );

// The one definition of net quantity: sold minus returned, used by totals, screens, receipt and stock.
const getNetQty = (line = {}) => Math.max(0, toNumber(line.quantity, 0) - computeReturnedQty(line));

// Lines are matched by product id plus variant/size, never by name.
const lineMatchKey = (line = {}) =>
  line.productId ? `${String(line.productId)}|${String(line.size || line.variant || '')}` : null;

const plainEntry = (entry = {}) => (typeof entry.toObject === 'function' ? entry.toObject() : { ...entry });

/**
 * Reads any stored invoice lines in the current shape: sale lines carry returns[] and a computed returnedQty.
 * Old separate return lines (mode "return") are merged into the sale line of the same product as an
 * entry without a time. A return line with no matching sale line is kept as it is.
 */
function canonicalizeLines(lines = []) {
  const plain = lines.map((line) => (line && typeof line.toObject === 'function' ? line.toObject() : { ...line }));
  const canonical = [];
  const returnLines = [];

  for (const line of plain) {
    if (resolveMode(line) === 'return') {
      returnLines.push(line);
      continue;
    }
    const returns = Array.isArray(line.returns) ? line.returns.map(plainEntry) : [];
    canonical.push({ ...line, mode: 'sale', return: false, sold: true, returns });
  }

  const orphans = [];
  for (const returnLine of returnLines) {
    let remaining = Math.max(0, toNumber(returnLine.quantity, 0));
    const key = lineMatchKey(returnLine);
    for (const sale of key ? canonical : []) {
      if (remaining <= 0) break;
      if (lineMatchKey(sale) !== key) continue;
      const room = Math.max(0, toNumber(sale.quantity, 0) - computeReturnedQty(sale));
      const take = Math.min(room, remaining);
      if (take <= 0) continue;
      sale.returns.push({
        qty: take,
        reason: returnLine.returnReason || '',
        refundAmount: take * Math.max(0, toNumber(sale.sellPrice, 0)),
      });
      remaining -= take;
    }
    if (remaining > 0) orphans.push({ ...returnLine, quantity: remaining, mode: 'return', return: true, sold: false });
  }

  return canonical.map((line) => ({ ...line, returnedQty: computeReturnedQty(line) })).concat(orphans);
}

const RETURN_STATUSES = ['active', 'partially_returned', 'fully_returned'];

// The single rule for the return status: invoices saved before it existed are active.
const resolveReturnStatus = (invoice = {}) =>
  RETURN_STATUSES.includes(invoice.returnStatus) ? invoice.returnStatus : 'active';

const isVoided = (invoice = {}) => invoice.voided === true;

// Status from the lines: nothing returned = active, everything returned = fully_returned.
function computeReturnStatus(items = []) {
  let sold = 0;
  let returned = 0;
  for (const item of canonicalizeLines(items)) {
    const quantity = Math.max(0, toNumber(item.quantity, 0));
    if (resolveMode(item) === 'return') returned += quantity;
    else {
      sold += quantity;
      returned += computeReturnedQty(item);
    }
  }
  if (returned <= 0) return 'active';
  return sold > 0 && returned >= sold ? 'fully_returned' : 'partially_returned';
}

// The one place a stored invoice is turned into the shape every screen reads. Run on the server when an
// invoice is read, so the list, view page, receipt and POS edit all get the same lines.
function normalizeInvoiceForRead(invoice) {
  if (!invoice) return invoice;
  const plain = typeof invoice.toObject === 'function' ? invoice.toObject() : { ...invoice };
  const productDetail = canonicalizeLines(plain.productDetail || []);
  return { ...plain, productDetail, returnStatus: computeReturnStatus(productDetail) };
}

/**
 * The one place invoice numbers are calculated. Used by save, the view page, the list and the receipt.
 * Sale lines get sold / returned / net quantities; every active return becomes a row with a negative amount.
 * @param {{ items?: Array<{ quantity?: number, sellPrice?: number, mode?: string, productId?: unknown, productName?: string, returnReason?: string, [key: string]: any }>, discount?: number }} options
 */
function summarizeInvoice({ items = [], discount = 0 }) {
  const safeDiscount = Math.max(0, toNumber(discount, 0));
  const saleRows = [];
  const returnRows = [];
  let soldTotal = 0;
  let returnedTotal = 0;

  for (const item of canonicalizeLines(items)) {
    const quantity = Math.max(0, toNumber(item.quantity, 0));
    const price = Math.max(0, toNumber(item.sellPrice, 0));

    if (resolveMode(item) === 'return') {
      returnedTotal += quantity * price;
      returnRows.push({ ...item, quantity, amount: -(quantity * price) });
      continue;
    }

    const returnedQty = computeReturnedQty(item);
    soldTotal += quantity * price;
    returnedTotal += returnedQty * price;
    saleRows.push({
      ...item,
      soldQty: quantity,
      returnedQty,
      netQty: getNetQty(item),
      soldAmount: quantity * price,
      netAmount: getNetQty(item) * price,
    });

    for (const entry of item.returns) {
      if (entry.cancelled) continue;
      const qty = Math.max(0, toNumber(entry.qty, 0));
      returnRows.push({
        productId: item.productId,
        productName: item.productName,
        quantity: qty,
        sellPrice: item.sellPrice,
        amount: -(qty * price),
        returnReason: entry.reason || '',
        at: entry.at,
        user: entry.user,
      });
    }
  }

  const subtotal = soldTotal - returnedTotal;
  return {
    saleRows,
    returnRows,
    soldTotal,
    returnedTotal,
    refundedAmount: returnedTotal,
    subtotal,
    discount: safeDiscount,
    grandTotal: Math.max(0, subtotal - safeDiscount),
    returnStatus: computeReturnStatus(items),
  };
}

/**
 * @param {{ items?: Array<{ quantity?: number, sellPrice?: number, mode?: string, return?: boolean }>, discount?: number }} options
 */
function calculateInvoiceTotals({ items = [], discount = 0 }) {
  const { subtotal, discount: safeDiscount, grandTotal, soldTotal, returnedTotal, refundedAmount } =
    summarizeInvoice({ items, discount });

  return {
    subtotal,
    discount: safeDiscount,
    grandTotal,
    soldTotal,
    returnedTotal,
    refundedAmount,
  };
}

function sortStockBatch(items = []) {
  return [...items].sort((left, right) => {
    const leftMode = resolveMode(left);
    const rightMode = resolveMode(right);

    if (leftMode === 'return' && rightMode !== 'return') return -1;
    if (leftMode !== 'return' && rightMode === 'return') return 1;
    return 0;
  });
}

function normalizeProductForChart(product = {}) {
  return {
    ...product,
    productId: product.productId ?? product._id ?? undefined,
    quantity: Math.max(0, toNumber(product.quantity, 0)),
    sellPrice: Math.max(0, toNumber(product.sellPrice, 0)),
  };
}

module.exports = {
  toNumber,
  resolveMode,
  computeReturnedQty,
  getNetQty,
  lineMatchKey,
  canonicalizeLines,
  normalizeInvoiceForRead,
  resolveReturnStatus,
  computeReturnStatus,
  isVoided,
  resolveItemKey,
  calculateLineTotal,
  calculateInvoiceTotals,
  summarizeInvoice,
  sortStockBatch,
  normalizeProductForChart,
};
