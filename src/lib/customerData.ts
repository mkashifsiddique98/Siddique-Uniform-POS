import { Types } from "mongoose";

type InvoiceDoc = {
  _id: unknown;
  invoiceNo?: number;
  customer?: {
    _id?: unknown;
    customerName?: string;
    schoolName?: string;
    phone?: number | null;
    prevBalance?: number;
    type?: string;
  };
  productDetail?: Array<{ productName?: string; quantity?: number; sellPrice?: number; return?: boolean }>;
  grandTotal?: number;
  prevBalance?: number;
  invoiceDate?: Date | string;
};

export const WHOLESALE_CUSTOMER_TYPE = "wholesaler";

export function isWholesaleCustomerInvoice(invoice: InvoiceDoc) {
  return invoice.customer?.type === WHOLESALE_CUSTOMER_TYPE;
}

// Wholesale customer records are derived from invoice snapshots, not Customer or Purchase records.
export function wholesaleCustomerInvoicesFilter(customerId?: string) {
  return {
    "customer.type": WHOLESALE_CUSTOMER_TYPE,
    ...(customerId ? { "customer._id": new Types.ObjectId(customerId) } : {}),
    voided: { $ne: true },
  };
}

export function toCustomerLedgerRecord(invoice: InvoiceDoc) {
  return {
    id: String(invoice._id),
    customerType: invoice.customer?.type,
    date: invoice.invoiceDate || new Date(0),
    reference: String(invoice.invoiceNo || invoice._id),
    grandTotal: Number(invoice.grandTotal || 0),
    prevBalance: Number(invoice.prevBalance || 0),
    lines: invoice.productDetail || [],
  };
}
