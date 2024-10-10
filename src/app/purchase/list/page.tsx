import AllProductTable from '@/app/product/list/ProductTable';
import BreadCrum from '@/components/custom-components/bread-crum'
import React from 'react'

const DOMAIN_NAME = process.env.DOMAIN_NAME;

async function getAllPrchaseData() {
  try {
    const res = await fetch(`${DOMAIN_NAME}/api/product`,
      {cache:"no-store"}
  );
   if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return null; // Return an empty array to handle missing data gracefully
  }
}
export default async function purchaseList  ()  {
    const data = await getAllPrchaseData();
  const response = data?.response || []; 

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Purchase" subfolder="List Purchase" />
       
    </div>
  )
}
