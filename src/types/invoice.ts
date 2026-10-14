import { customer } from "./customer";

// Assuming 'customer' is imported correctly

<<<<<<< HEAD
export interface ReturnEntry {
  qty: number;
  at?: string | Date;
  reason?: string;
  user?: string;
  refundAmount?: number;
  cancelled?: boolean;
}

=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
export interface ProductDetail {
  productName: string;  
  quantity: number;     
  sellPrice: number;    
  _id?: string | object;
<<<<<<< HEAD
  productId?: string | object;
  // Server-computed: sum of the non-cancelled returns
  returnedQty?: number;
  returns?: ReturnEntry[];
  returnReason?: string;
  return?: boolean;
  mode?: "sale" | "return";
=======
  return?: boolean;
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  sold?: Boolean;           
}

export interface Invoice {
  
  invoiceNo: number;          // Use `number`
  customer: customer;         // Ensure 'Customer' is the correct imported type
  productDetail: ProductDetail[];
  prevBalance: number;        // Use `number`
  grandTotal: number;         // Use `number`
<<<<<<< HEAD
  discount?: number;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  invoiceDate: Date;          // Use `Date`
  _id?: string;               // Use `string` and make it optional with `?`
  anyMessage: string
  dueDate?: Date | string | number;
  status?:string
<<<<<<< HEAD
  returnStatus?: "active" | "partially_returned" | "fully_returned";
  voided?: boolean;
  voidReason?: string;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
}
