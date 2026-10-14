export interface ProductFormState {
  productName: string;
  schoolName: string;
  supplier?: string;
  category: string;
  stockAlert: number;
  size: string;
  sellPrice: number;
  wholesalePrice: number;
  productCost: number;
  isBundle?: boolean;
<<<<<<< HEAD
  // Effective rule for this product: "clamp" (sell beyond stock, stock stops at 0) or "block"
  oversellMode?: "clamp" | "block";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  components?: string[];
  images: string[];
  quantity?: number;
  _id?: object;
  id?: number;
  __v?: number;
}
export interface FilterElementProps {
  filterBy: keyof ProductFormState | undefined | string;
  filterValue: string;
}
<<<<<<< HEAD


interface ReturnedProduct extends ProductFormState {
  returnedQuantity: number;
}
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
