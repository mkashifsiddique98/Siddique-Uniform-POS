"use client";

import React, { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// Types
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

const HorizontalBarChart = ({ invoices = [] }: HorizontalBarChartProps) => {
  const [data, setData] = useState<{ [key: string]: ProductDetail[] }>({});

  const timeRanges = [
    { key: "today", label: "Today" },
    { key: "week", label: "Last Week" },
    { key: "month", label: "Last Month" },
    { key: "threeMonths", label: "Last 3 Months" },
    { key: "sixMonths", label: "Last 6 Months" },
    { key: "year", label: "Last Year" },
  ];

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
      switch (range) {
        case "today":
          return date.toDateString() === now.toDateString();
        case "week":
          return date >= new Date(now.setDate(now.getDate() - 7));
        case "month":
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        case "threeMonths":
          return date >= new Date(now.setMonth(now.getMonth() - 3));
        case "sixMonths":
          return date >= new Date(now.setMonth(now.getMonth() - 6));
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
    <div className="space-y-8 p-4">
      {timeRanges.map(({ key, label }, index) => (
        <SalesChart key={key} title={`Top-Selling Products (${label})`} data={data[key]} color={chartColors[index]} />
      ))}
    </div>
  );
};

// Reusable Chart Component
const SalesChart = ({ title, data, color }: { title: string; data: ProductDetail[]; color: string }) => (
  <div className="bg-white shadow-md rounded-lg p-4">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={150} />
        <Tooltip />
        <Bar dataKey="quantity" fill={color} barSize={24} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const chartColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#82caff", "#d88484"];

export default HorizontalBarChart;
