"use client"
import React, { useEffect, useState } from 'react';
import BreadCrum from '@/components/custom-components/bread-crum';
import { TableSpecialOrder } from './tableSpecialOrder';

const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

// Fetching invoices as a separate async function
async function fetchInvoiceData() {
  try {
    const res = await fetch(`${DOMAIN_NAME}/api/invoice/`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return [];
  }
}

const SpecialOrder: React.FC = () => {
  const [invoiceList, setInvoiceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const data = await fetchInvoiceData();
        setInvoiceList(data.response || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Sale" subfolder="Special Order" />
      {invoiceList.length !== 0 ? (
        <TableSpecialOrder invoiceList={invoiceList} />
      ) : (
        <div>No Special found</div>
      )}
    </div>
  );
};

export default SpecialOrder;
