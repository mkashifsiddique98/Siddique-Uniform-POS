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
  // Effective rule for this product: "clamp" (sell beyond stock, stock stops at 0) or "block"
  oversellMode?: "clamp" | "block";
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


interface ReturnedProduct extends ProductFormState {
  returnedQuantity: number;
}