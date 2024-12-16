"use client";

import { Invoice } from "@/types/invoice";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Label } from "recharts";

// Helper function to format numbers as K (e.g., 1500 -> 1.5K)
const formatNumber = (value: number) => {
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  }
  return value.toString();
};

interface InvoiceListProps {
  name: string;
  total: number;
}

export function Overview({ InvoiceData }: { InvoiceData: Invoice[] }) {
  const [invoiceList, setInvoiceList] = useState<InvoiceListProps[]>([]);

  // Function to process invoice data
  const processInvoiceData = (invoices: Invoice[]): InvoiceListProps[] => {
    const monthTotals: Record<string, number> = {};

    // Calculate total for each month
    invoices.forEach((invoice) => {
      const date = new Date(invoice.invoiceDate);
      const monthName = date.toLocaleString("default", { month: "short" });

      if (!monthTotals[monthName]) {
        monthTotals[monthName] = 0;
      }
      monthTotals[monthName] += invoice.grandTotal;
    });

    // Convert month totals into an array of { name, total }
    return Object.keys(monthTotals).map((month) => ({
      name: month,
      total: monthTotals[month],
    }));
  };

  useEffect(() => {
    const formattedData = processInvoiceData(InvoiceData);
    setInvoiceList(formattedData);
  }, [InvoiceData]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={invoiceList}>
        {/* Add CartesianGrid for background grid */}
        <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />

        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatNumber(value)} // Format Y-axis values
          tickCount={6}
        >
          {/* Custom label for the Y-axis */}
          <Label value="PKR" angle={90} position="bottom" offset={0} fontSize={14} fill="#888888"  fontWeight={600}/>
        </YAxis>

        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
