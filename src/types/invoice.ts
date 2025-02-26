import { customer } from "./customer";

// Assuming 'customer' is imported correctly

export interface ProductDetail {
  productName: string;  
  quantity: number;     
  sellPrice: number;    
  _id?: string | object;
  return?: boolean          
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
