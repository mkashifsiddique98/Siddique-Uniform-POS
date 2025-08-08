"use client";

import { Invoice } from "@/types/invoice";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
  Tooltip,
} from "recharts";

const formatNumber = (value: number) =>
  value >= 1000000
    ? (value / 1000000).toFixed(1) + "M"
    : value >= 1000
    ? (value / 1000).toFixed(1) + "K"
    : value.toString();

const MONTH_ORDER = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface InvoiceListProps {
  name: string;
  total: number;
}

export function Overview({ InvoiceData }: { InvoiceData: Invoice[] }) {
  const [invoiceList, setInvoiceList] = useState<InvoiceListProps[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Extract unique years from data and sort descending
  useEffect(() => {
    const years = Array.from(
      new Set(InvoiceData.map(inv => new Date(inv.invoiceDate).getFullYear()))
    ).sort((a, b) => b - a);
    setAvailableYears(years);
    setSelectedYear(years[0] ?? null);
  }, [InvoiceData]);

  const processInvoiceData = (invoices: Invoice[], year: number): InvoiceListProps[] => {
    const monthTotals: Record<string, number> = {};

    invoices.forEach((invoice) => {
      const date = new Date(invoice.invoiceDate);
      if (date.getFullYear() === year) {
        const month = date.toLocaleString("default", { month: "short" });
        monthTotals[month] = (monthTotals[month] || 0) + invoice.grandTotal;
      }
    });

    return MONTH_ORDER.filter((m) => m in monthTotals).map((m) => ({
      name: m,
      total: monthTotals[m],
    }));
  };

  // Update invoice list when selectedYear or InvoiceData changes
  useEffect(() => {
    if (selectedYear !== null) {
      setInvoiceList(processInvoiceData(InvoiceData, selectedYear));
    }
  }, [InvoiceData, selectedYear]);

  return (
    <div className="bg-white dark:bg-[#1f2937] shadow-lg rounded-xl p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
          📊 Monthly Sales Overview
        </h2>

        <select
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-gray-700 dark:text-gray-200 bg-white dark:bg-[#374151] focus:outline-none focus:ring-2 focus:ring-green-400"
          value={selectedYear ?? ""}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {invoiceList.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No sales data available for {selectedYear}.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={invoiceList}
            margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
          >
            <defs>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              fontSize={13}
              tickLine={false}
              axisLine={false}
              className="text-gray-600"
            />

            <YAxis
              stroke="#9ca3af"
              fontSize={13}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatNumber}
            >
              <Label
                value="Total Sales (PKR)"
                angle={-90}
                position="insideLeft"
                fontSize={14}
                fill="#6b7280"
                fontWeight={600}
              />
            </YAxis>

            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                fontSize: 13,
              }}
              formatter={(value: number) => [`PKR ${value.toLocaleString()}`, "Total"]}
              labelStyle={{ color: "#374151" }}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />

            <Bar
              dataKey="total"
              fill="url(#greenGradient)"
              radius={[6, 6, 0, 0]}
              barSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
