import { customer } from "./customer";

interface Product {
  productName: { type: String };
  quantity: { type: Number };
  sellPrice: { type: Number };
}
export interface invoice {
  invoiceNo: Number;
  customer: customer;
  productDetail: Product[];
  prevBalance: Number;
  grandTotal: Number ;
}
