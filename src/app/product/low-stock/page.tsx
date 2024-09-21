import { ProductFormState } from "@/types/product";
import React from "react";
import TableLowStock from "./tableLowStock";
const DOMAIN_NAME = process.env.DOMAIN_NAME;
async function getAllProductData() {
  try {
    const res = await fetch(`${DOMAIN_NAME}/api/product`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return null; // Return an empty array to handle missing data gracefully
  }
}
export default async function LowStock() {
  const dataProduct = await getAllProductData();
  const productResponse: ProductFormState[] = dataProduct?.response || [];
  return (
    <div>
      {productResponse && <TableLowStock productResponse={productResponse} />}
      {productResponse.length === 0 && (
        <p className="font-extrabold text-centre">All Stock is Okey!</p>
      )}
    </div>
  );
}
