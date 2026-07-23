import { ProductFormState } from "@/types/product";
import { Invoice } from "@/types/invoice";

export function calculateZakat(
  products: any[],
  invoices: Invoice[],
  cashInHand: number = 0
) {
  // 1. Inventory Value (Current stock quantity * cost or sell price)
  const totalInventoryValue = products.reduce((acc, product) => {
    const qty = product.quantity || product.stock || 0;
    const price = product.price || product.sellPrice || 0;
    return acc + qty * price;
  }, 0);

  // 2. Pending Receivables (Invoices unpaid or partially paid)
  const totalReceivables = invoices.reduce((acc, inv) => {
    const total = inv.grandTotal || 0;
    const paid = inv.paidAmount || 0;
    return acc + Math.max(0, total - paid);
  }, 0);

  // 3. Zakat Net Base
  const zakatBase = totalInventoryValue + totalReceivables + cashInHand;

  // 4. Zakat Payable (2.5%)
  const zakatPayable = Math.max(0, zakatBase * 0.025);

  return {
    totalInventoryValue,
    totalReceivables,
    cashInHand,
    zakatBase,
    zakatPayable,
  };
}