import mongoose from "mongoose";

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
  paidAmount: number;
};

export type PurchaseRecord = {
  _id?: unknown;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  isPaid?: boolean;
  paidAmount?: number;
  wholesalerId?: unknown;
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
    paidAmount: Number(record.paidAmount || 0),
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

// Purchases of one supplier (Wholesaler). Falls back to the embedded copy only for
// purchases that the migration script has not linked yet.
export function purchasesOfWholesaler(wholesalerId: string | { toString(): string }) {
  const id = new mongoose.Types.ObjectId(String(wholesalerId));
  return {
    $or: [
      { wholesalerId: id },
      { wholesalerId: { $exists: false }, "wholesaler._id": id },
    ],
  };
}
