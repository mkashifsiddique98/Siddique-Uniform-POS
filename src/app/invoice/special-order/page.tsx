import BreadCrum from '@/components/custom-components/bread-crum'
import React from 'react'
import { TableSpecialOrder } from './tableSpecialOrder';
const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

// Fetching invoices as a separate async function
async function fetchInvoiceData() {
  try {
    const res = await fetch(`${DOMAIN_NAME}/api/invoice/`,
      { cache: 'no-store' }
  );
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return [];
  }
}

export default async function SpecialOrder ()  {
    const invoiceDate = await fetchInvoiceData()
    const invoiceList = invoiceDate.response || []
  return (
    <div className='container p-6'>
        <BreadCrum mainfolder="Sale" subfolder="Special Order" />
        <TableSpecialOrder invoiceList={invoiceList}/>
    </div>
  )
}
