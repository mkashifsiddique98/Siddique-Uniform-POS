"use client";

import { Invoice } from "@/types/invoice";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Label, Tooltip } from "recharts";

// Helper function to format numbers as K (e.g., 1500 -> 1.5K)
const formatNumber = (value: number) => (value >= 1000 ? (value / 1000).toFixed(1) + "K" : value.toString());

interface InvoiceListProps {
  name: string;
  total: number;
}

export function Overview({ InvoiceData }: { InvoiceData: Invoice[] }) {
  const [invoiceList, setInvoiceList] = useState<InvoiceListProps[]>([]);

  // Function to process invoice data
  const processInvoiceData = (invoices: Invoice[]): InvoiceListProps[] => {
    const monthTotals: Record<string, number> = {};

    invoices.forEach((invoice) => {
      const date = new Date(invoice.invoiceDate);
      const monthName = date.toLocaleString("default", { month: "short" });

      monthTotals[monthName] = (monthTotals[monthName] || 0) + invoice.grandTotal;
    });

    return Object.keys(monthTotals).map((month) => ({
      name: month,
      total: monthTotals[month],
    }));
  };

  useEffect(() => {
    setInvoiceList(processInvoiceData(InvoiceData));
  }, [InvoiceData]);

  return (
    <div className="bg-white shadow-lg rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Sale Overview</h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={invoiceList}>
          {/* Background Grid */}
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {/* X-Axis */}
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            className="text-gray-600"
          />

          {/* Y-Axis with formatted values */}
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
            tickCount={6}
          >
            <Label value="Sale (PKR)" angle={-90} position="insideLeft" fontSize={14} fill="#6b7280" fontWeight={600} />
          </YAxis>

          {/* Tooltip for better UX */}
          <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />

          {/* Bar with smooth radius and subtle gradient */}
          <Bar dataKey="total" fill="url(#gradient)" radius={[6, 6, 0, 0]} barSize={40} />

          {/* Gradient for a modern look */}
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#8BC34A" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
