"use client";

import React, { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// Product data type
interface ProductDetail {
  productName: string;
  quantity: number;
}

// Invoice data type
interface Invoice {
  invoiceDate: string; // Ensure date format is ISO 8601 or similar
  productDetail: ProductDetail[];
}

// Props for the component
interface HorizontalBarChartProps {
  invoices?: Invoice[]; // Allow undefined for safety
}

const HorizontalBarChart = ({ invoices = [] }: HorizontalBarChartProps) => {
  const [todayData, setTodayData] = useState<ProductDetail[]>([]);
  const [weekData, setWeekData] = useState<ProductDetail[]>([]);
  const [monthData, setMonthData] = useState<ProductDetail[]>([]);
  const [threeMonthsData, setThreeMonthsData] = useState<ProductDetail[]>([]);
  const [sixMonthsData, setSixMonthsData] = useState<ProductDetail[]>([]);
  const [yearData, setYearData] = useState<ProductDetail[]>([]);

  // Helper function to group product quantities
  const groupProducts = (filteredInvoices: Invoice[]) => {
    const productMap: Record<string, number> = {};

    filteredInvoices.forEach((invoice) => {
      invoice.productDetail.forEach((product) => {
        if (productMap[product.productName]) {
          productMap[product.productName] += product.quantity;
        } else {
          productMap[product.productName] = product.quantity;
        }
      });
    });

    return Object.entries(productMap)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  };

  // Function to filter invoices by date range
  const filterInvoices = (range: "today" | "week" | "month" | "threeMonths" | "sixMonths" | "year") => {
    const now = new Date();
    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate);
      if (range === "today") {
        return (
          invoiceDate.getDate() === now.getDate() &&
          invoiceDate.getMonth() === now.getMonth() &&
          invoiceDate.getFullYear() === now.getFullYear()
        );
      } else if (range === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return invoiceDate >= oneWeekAgo && invoiceDate <= now;
      } else if (range === "month") {
        return (
          invoiceDate.getMonth() === now.getMonth() &&
          invoiceDate.getFullYear() === now.getFullYear()
        );
      } else if (range === "threeMonths") {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return invoiceDate >= threeMonthsAgo && invoiceDate <= now;
      } else if (range === "sixMonths") {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return invoiceDate >= sixMonthsAgo && invoiceDate <= now;
      } else if (range === "year") {
        return invoiceDate.getFullYear() === now.getFullYear();
      }
      return false;
    });
  };

  // Process data when invoices change
  useEffect(() => {
    setTodayData(groupProducts(filterInvoices("today")));
    setWeekData(groupProducts(filterInvoices("week")));
    setMonthData(groupProducts(filterInvoices("month")));
    setThreeMonthsData(groupProducts(filterInvoices("threeMonths")));
    setSixMonthsData(groupProducts(filterInvoices("sixMonths")));
    setYearData(groupProducts(filterInvoices("year")));
  }, [invoices]);

  return (
    <div className="space-y-8">
      {/* Chart for today's sales */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Top-Selling Products (Today)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={todayData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#8884d8" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart for last week's sales */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Top-Selling Products (Last Week)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weekData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#82ca9d" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart for last month's sales */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Top-Selling Products (Last Month)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#ffc658" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart for last three months' sales */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Top-Selling Products (Last 3 Months)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={threeMonthsData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#ff7300" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart for last six months' sales */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Top-Selling Products (Last 6 Months)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sixMonthsData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#82caff" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart for last year's sales */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Top-Selling Products (Last Year)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yearData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#d88484" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HorizontalBarChart;
