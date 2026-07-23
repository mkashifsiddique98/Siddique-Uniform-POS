import { ProductFormState } from "./product";

  
  type Wholesaler = {
    _id: string;
    name: string;
    location: string;
    phone: string;
    paymentStatus: "Clear" | "Pending";
    pendingBalance: number;
  };
  
 export type Purchase = {
    _id: string,
    wholesaler: Wholesaler;
    products: ProductFormState[];
    isPaid: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
