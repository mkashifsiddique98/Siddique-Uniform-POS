export type SupplierLedgerInput = {
  id: string;
  date: Date | string;
  reference: string;
  products: Array<{
    productName?: string;
    quantity?: number;
    productCost?: number;
  }>;
  isPaid: boolean;
};

export type PurchaseRecord = {
  _id?: unknown;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  isPaid?: boolean;
  wholesaler?: {
    _id?: unknown;
    name?: string;
    location?: string;
    phone?: string;
  };
  products?: Array<{
    _id?: unknown;
    productName?: string;
    quantity?: number;
    productCost?: number;
    wholesalePrice?: number;
    productId?: unknown;
  }>;
};

export function toSupplierLedgerInput(record: PurchaseRecord): SupplierLedgerInput {
  return {
    id: String(record._id || ""),
    date: record.createdAt || new Date(0),
    reference: String(record._id || "Purchase"),
    isPaid: Boolean(record.isPaid),
    products: (record.products || []).map((product) => ({
      productName: product.productName,
      quantity: Number(product.quantity || 0),
      productCost: Number(product.productCost || 0),
    })),
  };
}

export function purchaseValue(record: PurchaseRecord): number {
  return (record.products || []).reduce(
    (sum, product) => sum + Number(product.productCost || 0) * Number(product.quantity || 0),
    0
  );
}

export type InvoiceIdentity = {
  customerName?: string;
  schoolName?: string;
  phone?: number;
};

export function normalizeIdentity(value: string | number | undefined): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function sameInvoiceCustomer(
  invoiceCustomer: InvoiceIdentity | undefined,
  wholesaler: { name: string; phone: string }
): "phone" | "name" | "none" {
  if (!invoiceCustomer) return "none";
  const wholesalerPhone = normalizeIdentity(wholesaler.phone);
  const invoicePhone = normalizeIdentity(invoiceCustomer.phone);
  if (wholesalerPhone && invoicePhone && wholesalerPhone === invoicePhone) return "phone";
  if (normalizeIdentity(invoiceCustomer.customerName) === normalizeIdentity(wholesaler.name)) return "name";
  return "none";
}
