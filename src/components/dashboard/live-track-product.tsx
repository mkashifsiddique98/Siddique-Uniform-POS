"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ===============================
// INTERFACES
// ===============================

interface ProductDetail {
  productName: string;
  quantity: number;
  category: string;
}

interface Invoice {
  invoiceDate: string;
  productDetail: ProductDetail[];
}

interface HorizontalBarChartProps {
  invoices?: Invoice[];
}

interface ChartItem {
  name: string;
  quantity: number;
}

// ===============================
// CONSTANTS
// ===============================

const timeRanges = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Last 7 Days" },
  { key: "month", label: "This Month" },
  { key: "threeMonths", label: "Last 3 Months" },
  { key: "sixMonths", label: "Last 6 Months" },
  { key: "year", label: "This Year" },
] as const;

const chartColors = [
  "#6366f1",
  "#f43f5e",
  "#10b981",
  "#f59e0b",
  "#0ea5e9",
  "#a855f7",
  "#ef4444",
];

// ===============================
// DATE HELPERS
// ===============================

const isSameDate = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const subtractDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const subtractMonths = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
};

// ===============================
// SKELETON COMPONENT
// ===============================

const ChartSkeleton = () => (
  <div className="bg-white dark:bg-[#1f2937] p-6 rounded-lg shadow space-y-4 animate-pulse">
    <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
    <div className="h-64 w-full bg-gray-300 rounded"></div>
  </div>
);

// ===============================
// EMPTY STATE COMPONENT
// ===============================

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center py-10 text-gray-400">
    <span className="text-4xl mb-3">📭</span>
    <p className="text-lg">{message}</p>
  </div>
);

// ===============================
// MAIN COMPONENT
// ===============================

const HorizontalBarChart = ({ invoices = [] }: HorizontalBarChartProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  // -------------------------------
  // SIMULATE LOADING
  // -------------------------------
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [invoices]);

  // -------------------------------
  // FILTER INVOICES BY RANGE
  // -------------------------------
  const filterInvoices = useMemo(
    () => (range: string) => {
      const now = new Date();

      return invoices.filter(({ invoiceDate }) => {
        const date = new Date(invoiceDate);

        switch (range) {
          case "today":
            return isSameDate(date, now);
          case "yesterday":
            return isSameDate(date, subtractDays(1));
          case "week":
            return date >= subtractDays(7);
          case "month":
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          case "threeMonths":
            return date >= subtractMonths(3);
          case "sixMonths":
            return date >= subtractMonths(6);
          case "year":
            return date.getFullYear() === now.getFullYear();
          default:
            return false;
        }
      });
    },
    [invoices]
  );

  // -------------------------------
  // GROUP PRODUCTS FOR RANGE CHARTS
  // -------------------------------
  const groupedData = useMemo(() => {
    const result: Record<string, ChartItem[]> = {};

    timeRanges.forEach(({ key }) => {
      const filtered = filterInvoices(key);

      const map: Record<string, number> = {};
      filtered.forEach((inv) => {
        inv.productDetail.forEach((p) => {
          map[p.productName] = (map[p.productName] || 0) + p.quantity;
        });
      });

      result[key] = Object.entries(map)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity);
    });

    return result;
  }, [invoices, filterInvoices]);

  // -------------------------------
  // PRODUCT-SPECIFIC SALES
  // -------------------------------
  const getProductSales = (productName: string, range: string) => {
    const filtered = filterInvoices(range);

    let total = 0;
    const dayMap: Record<string, number> = {};

    filtered.forEach((inv) => {
      const dateStr = inv.invoiceDate.slice(0, 10);

      inv.productDetail.forEach((p) => {
        if (p.productName.toLowerCase() === productName.toLowerCase()) {
          total += p.quantity;
          dayMap[dateStr] = (dayMap[dateStr] || 0) + p.quantity;
        }
      });
    });

    const dailySales = Object.entries(dayMap).map(([date, qty]) => ({ date, qty }));

    return { total, dailySales };
  };

  // -------------------------------
  // CATEGORY SALES (MONTH)
  // -------------------------------
  const categorySales = useMemo(() => {
    const filtered = filterInvoices("month");
    const map: Record<string, number> = {};

    filtered.forEach((inv) => {
      inv.productDetail.forEach((p) => {
        map[p.category] = (map[p.category] || 0) + p.quantity;
      });
    });

    return Object.entries(map).map(([category, qty]) => ({ category, qty }));
  }, [invoices, filterInvoices]);

  // -------------------------------
  // PRODUCT SUGGESTIONS
  // -------------------------------
  const allProducts = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) =>
      inv.productDetail.forEach((p) => set.add(p.productName.trim()))
    );
    return [...set];
  }, [invoices]);

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return allProducts.filter((p) =>
      p.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allProducts]);

  // -------------------------------
  // PREPARE DATA FOR TABLE
  // -------------------------------
  const monthData = groupedData["month"] || [];

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="space-y-10 p-6 bg-gray-50 dark:bg-[#111827] rounded-xl">

      {/* TOGGLE CHART / TABLE */}
      <div className="flex items-center gap-4 mb-4">
        <label className="cursor-pointer flex items-center gap-2">
          <span>Chart</span>
          <input
            type="checkbox"
            checked={viewMode === "table"}
            onChange={() =>
              setViewMode(viewMode === "chart" ? "table" : "chart")
            }
            className="toggle"
          />
          <span>Table</span>
        </label>
      </div>

      {/* SEARCH BOX */}
      <div className="relative w-full mb-4">
        <input
          type="text"
          placeholder="Search product..."
          className="border px-3 py-2 rounded w-full"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => setShowSuggestions(true)}
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className="absolute z-20 bg-white border w-full rounded shadow max-h-60 overflow-y-auto">
            {filteredSuggestions.map((item) => (
              <li
                key={item}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onMouseDown={() => {
                  setSearchTerm(item);
                  setSelectedProduct(item);
                  setShowSuggestions(false);
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* LOADING SKELETON */}
      {loading && (
        <>
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </>
      )}

      {/* EMPTY STATE */}
      {!loading && invoices.length === 0 && (
        <EmptyState message="No invoices found for selected filters." />
      )}

      {/* SELECTED PRODUCT VIEW */}
      {!loading && selectedProduct ? (
        <SingleProductStats product={selectedProduct} getProductSales={getProductSales} />
      ) : (
        !loading &&
        viewMode === "chart" && (
          <>
            {timeRanges.map(({ key, label }, index) =>
              groupedData[key]?.length ? (
                <SalesChart
                  key={key}
                  title={`Top-Selling Products – ${label}`}
                  data={groupedData[key]}
                  color={chartColors[index % chartColors.length]}
                />
              ) : null
            )}

            <CategoryChart data={categorySales} />
          </>
        )
      )}

      {/* TABLE VIEW */}
      {!loading && viewMode === "table" && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Product Sales Table</h2>
          {monthData.length === 0 ? (
            <EmptyState message="No product data for this month." />
          ) : (
            <table className="w-full text-left border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Product</th>
                  <th className="p-2 border">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {monthData.map((item: any) => (
                  <tr key={item.name} className="border">
                    <td className="p-2 border">{item.name}</td>
                    <td className="p-2 border">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// ===============================
// CHART COMPONENTS
// ===============================

const SalesChart = ({ title, data, color }: any) => (
  <div className="bg-white dark:bg-[#1f2937] p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-3">{title}</h2>
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={160} />
        <Tooltip />
        <Bar dataKey="quantity" fill={color} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const SingleProductStats = ({ product, getProductSales }: any) => {
  const week = getProductSales(product, "week");
  const month = getProductSales(product, "month");
  const year = getProductSales(product, "year");

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">📦 Sales for: {product}</h2>

      <ul className="space-y-2 text-lg mb-6">
        <li>🗓️ This Week: <b>{week.total}</b></li>
        <li>📅 This Month: <b>{month.total}</b></li>
        <li>📆 This Year: <b>{year.total}</b></li>
      </ul>

      <h3 className="font-semibold mb-2">Daily Sales (This Month)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={month.dailySales}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="qty" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const CategoryChart = ({ data }: any) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-3">📂 Category-Wise Sales (This Month)</h2>
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="qty" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default HorizontalBarChart;
