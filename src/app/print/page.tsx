'use client';

import { useState } from 'react';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptData {
  storeName: string;
  items: ReceiptItem[];
  total: number;
}

export default function PrintReceipt() {
  const [loading, setLoading] = useState(false);

  const printReceipt = async () => {
    setLoading(true);

    const receiptData: ReceiptData = {
      storeName: 'My Store',
      items: [
        { name: 'Item 1', quantity: 2, price: 5.00 },
        { name: 'Item 2', quantity: 1, price: 10.00 },
        { name: 'Item 3', quantity: 3, price: 3.00 },
      ],
      total: 39.00,
    };

    try {
      const response = await fetch('/api/print-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
      } else {
        const errorData = await response.json();
        alert('Failed to print receipt: ' + errorData.message );
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while printing the receipt.'+ error);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Print Receipt</h1>
      <button onClick={printReceipt} disabled={loading}>
        {loading ? 'Printing...' : 'Print Receipt'}
      </button>
    </div>
  );
}
