import { customer } from "./customer";

// Assuming 'customer' is imported correctly

export interface ProductDetail {
  productName: string;  // Use `string` instead of `{ type: String }`
  quantity: number;     // Use `number` instead of `{ type: Number }`
  sellPrice: number;    // Use `number`
  _id: string;          // Use `string`
}

export interface Invoice {
  invoiceNo: number;          // Use `number`
  customer: customer;         // Ensure 'Customer' is the correct imported type
  productDetail: ProductDetail[];
  prevBalance: number;        // Use `number`
  grandTotal: number;         // Use `number`
  invoiceDate: Date;          // Use `Date`
  _id?: string;               // Use `string` and make it optional with `?`
  anyMessage: string
  dueDate?: Date | string | number;
  status?:string
}
