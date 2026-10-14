import { customer } from "./customer";

// Assuming 'customer' is imported correctly

export interface ReturnEntry {
  qty: number;
  at?: string | Date;
  reason?: string;
  user?: string;
  refundAmount?: number;
  cancelled?: boolean;
}

export interface ProductDetail {
  productName: string;  
  quantity: number;     
  sellPrice: number;    
  _id?: string | object;
  productId?: string | object;
  // Server-computed: sum of the non-cancelled returns
  returnedQty?: number;
  returns?: ReturnEntry[];
  returnReason?: string;
  return?: boolean;
  mode?: "sale" | "return";
  sold?: Boolean;           
}

export interface Invoice {
  
  invoiceNo: number;          // Use `number`
  customer: customer;         // Ensure 'Customer' is the correct imported type
  productDetail: ProductDetail[];
  prevBalance: number;        // Use `number`
  grandTotal: number;         // Use `number`
  discount?: number;
  invoiceDate: Date;          // Use `Date`
  _id?: string;               // Use `string` and make it optional with `?`
  anyMessage: string
  dueDate?: Date | string | number;
  status?:string
  returnStatus?: "active" | "partially_returned" | "fully_returned";
  voided?: boolean;
  voidReason?: string;
}
