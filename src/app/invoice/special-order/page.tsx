import React from 'react';
import BreadCrum from '@/components/custom-components/bread-crum';
import { TableSpecialOrder } from './tableSpecialOrder';

const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

// Server-side function to fetch invoice data
async function fetchInvoiceData() {
  try {
    const res = await fetch(`${DOMAIN_NAME}/api/invoice/`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return { response: [] };
  }
}

// Component that receives server-side data
const SpecialOrder = async () => {
  const data = await fetchInvoiceData();
  const invoiceList = data.response || [];

  if (!invoiceList.length) {
    return (
      <div className="container p-6">
        <BreadCrum mainfolder="Sale" subfolder="Special Order" />
        <div>No Special found</div>
      </div>
    );
  }

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Sale" subfolder="Special Order" />
      <TableSpecialOrder invoiceList={invoiceList} />
    </div>
  );
};

export default SpecialOrder;
