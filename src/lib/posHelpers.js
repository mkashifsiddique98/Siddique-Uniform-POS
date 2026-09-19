const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveMode = (item = {}) => {
  const rawMode = String(item.mode || (item.return ? 'return' : 'sale')).toLowerCase();
  return rawMode === 'return' ? 'return' : 'sale';
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

/**
 * @param {{ items?: Array<{ quantity?: number, sellPrice?: number, mode?: string, return?: boolean }>, discount?: number }} options
 */
function calculateInvoiceTotals({ items = [], discount = 0 }) {
  const safeDiscount = Math.max(0, toNumber(discount, 0));
  const subtotal = items.reduce((sum, item) => {
    const quantity = Math.max(0, toNumber(item.quantity, 0));
    const price = Math.max(0, toNumber(item.sellPrice, 0));
    const mode = resolveMode(item);
    const signedValue = mode === 'return' ? -1 : 1;
    return sum + quantity * price * signedValue;
  }, 0);

  const grandTotal = Math.max(0, subtotal - safeDiscount);

  return {
    subtotal,
    discount: safeDiscount,
    grandTotal,
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
  resolveItemKey,
  calculateLineTotal,
  calculateInvoiceTotals,
  sortStockBatch,
  normalizeProductForChart,
};
