"use client";

import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ProductDetail {
  productName: string;
  quantity: number;
}

interface Invoice {
  invoiceDate: string;
  productDetail: ProductDetail[];
}

interface HorizontalBarChartProps {
  invoices?: Invoice[];
}

const timeRanges = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Last 7 Days" },
  { key: "month", label: "This Month" },
  { key: "threeMonths", label: "Last 3 Months" },
  { key: "sixMonths", label: "Last 6 Months" },
  { key: "year", label: "This Year" },
];

const chartColors = [
  "#6366f1", // Indigo
  "#f43f5e", // Rose
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#0ea5e9", // Sky
  "#a855f7", // Purple
  "#ef4444", // Red
];

const HorizontalBarChart = ({ invoices = [] }: HorizontalBarChartProps) => {
  const [data, setData] = useState<{ [key: string]: ProductDetail[] }>({});

  const groupProducts = (filteredInvoices: Invoice[]) => {
    const productMap: Record<string, number> = {};
    filteredInvoices.forEach((invoice) => {
      invoice.productDetail.forEach(({ productName, quantity }) => {
        productMap[productName] = (productMap[productName] || 0) + quantity;
      });
    });
    return Object.entries(productMap)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  };

  const filterInvoices = (range: string) => {
    const now = new Date();
    return invoices.filter(({ invoiceDate }) => {
      const date = new Date(invoiceDate);

      const isSameDate = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      switch (range) {
        case "today":
          return isSameDate(date, now);
        case "yesterday":
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          return isSameDate(date, yesterday);
        case "week":
          return date >= new Date(new Date().setDate(now.getDate() - 7));
        case "month":
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        case "threeMonths":
          return date >= new Date(new Date().setMonth(now.getMonth() - 3));
        case "sixMonths":
          return date >= new Date(new Date().setMonth(now.getMonth() - 6));
        case "year":
          return date.getFullYear() === now.getFullYear();
        default:
          return false;
      }
    });
  };

  useEffect(() => {
    const processedData: { [key: string]: ProductDetail[] } = {};
    timeRanges.forEach(({ key }) => {
      processedData[key] = groupProducts(filterInvoices(key));
    });
    setData(processedData);
  }, [invoices]);

  return (
    <div className="space-y-10 p-6 bg-gray-50 dark:bg-[#111827] rounded-xl shadow-lg">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-4 tracking-tight">
        🛒 Product Sales Breakdown
      </h1>

      {timeRanges.map(({ key, label }, index) =>
        data[key] && data[key].length > 0 ? (
          <SalesChart
            key={key}
            title={`Top-Selling Products – ${label}`}
            data={data[key]}
            color={chartColors[index % chartColors.length]}
          />
        ) : null
      )}
    </div>
  );
};

const SalesChart = ({
  title,
  data,
  color,
}: {
  title: string;
  data: ProductDetail[];
  color: string;
}) => (
  <div className="bg-white dark:bg-[#1f2937] p-6 rounded-lg shadow transition-all duration-300 hover:shadow-xl">
    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2">
      {title}
    </h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" stroke="#9ca3af" />
        <YAxis
          dataKey="name"
          type="category"
          width={180}
          tick={{ fontSize: 13 }}
          stroke="#6b7280"
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #d1d5db" }}
          cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
        />
        <Bar
          dataKey="quantity"
          fill={color}
          barSize={24}
          radius={[10, 10, 0, 0]}
          animationDuration={600}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default HorizontalBarChart;
