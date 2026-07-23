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
  value >= 1000 ? (value / 1000).toFixed(1) + "K" : value.toString();

interface InvoiceListProps {
  name: string;
  total: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface MonthYear {
  month: number;
  year: number;
}

export function MonthlyOverview({ InvoiceData }: { InvoiceData: Invoice[] }) {
  const today = new Date();

  const [invoiceList, setInvoiceList] = useState<InvoiceListProps[]>([]);
  const [availableDates, setAvailableDates] = useState<MonthYear[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const extractAvailableDates = (invoices: Invoice[]): MonthYear[] => {
    const seen = new Set<string>();
    const results: MonthYear[] = [];

    invoices.forEach((invoice) => {
      const date = new Date(invoice.invoiceDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;

      const isFuture =
        year > today.getFullYear() ||
        (year === today.getFullYear() && month > today.getMonth());

      if (!seen.has(key) && !isFuture) {
        seen.add(key);
        results.push({ year, month });
      }
    });

    return results.sort((a, b) => a.year - b.year || a.month - b.month);
  };

  const processInvoiceData = (
    invoices: Invoice[],
    month: number,
    year: number
  ): InvoiceListProps[] => {
    const dayTotals: Record<string, number> = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      dayTotals[day.toString()] = 0;
    }

    invoices.forEach((invoice) => {
      const date = new Date(invoice.invoiceDate);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate().toString();
        dayTotals[day] += invoice.grandTotal;
      }
    });

    return Object.keys(dayTotals).map((day) => ({
      name: day,
      total: dayTotals[day],
    }));
  };

  useEffect(() => {
    const dates = extractAvailableDates(InvoiceData);
    setAvailableDates(dates);

    const defaultDate = dates.find(
      (d) => d.year === today.getFullYear() && d.month === today.getMonth()
    ) || dates[dates.length - 1];

    if (defaultDate) {
      setSelectedMonth(defaultDate.month);
      setSelectedYear(defaultDate.year);
      setInvoiceList(processInvoiceData(InvoiceData, defaultDate.month, defaultDate.year));
    }
  }, [InvoiceData]);

  useEffect(() => {
    setInvoiceList(processInvoiceData(InvoiceData, selectedMonth, selectedYear));
  }, [selectedMonth, selectedYear, InvoiceData]);

  return (
    <div className="bg-gradient-to-br from-white via-slate-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-wide">
          📊 Sales in {monthNames[selectedMonth]} {selectedYear}
        </h2>

        <div className="flex gap-3 mt-4 sm:mt-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {availableDates
              .filter((d) => d.year === selectedYear)
              .map((d) => (
                <option key={`${d.year}-${d.month}`} value={d.month}>
                  {monthNames[d.month]}
                </option>
              ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => {
              const year = parseInt(e.target.value);
              setSelectedYear(year);
              const monthsForYear = availableDates.filter((d) => d.year === year);
              if (!monthsForYear.find((m) => m.month === selectedMonth)) {
                setSelectedMonth(monthsForYear[0]?.month || 0);
              }
            }}
            className="rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {[...new Set(availableDates.map((d) => d.year))].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={370}>
        <BarChart data={invoiceList}>
          <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: "Day", position: "insideBottom", offset: -2, }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
          >
            <Label
              value="Sale (PKR)"
              angle={-90}
              position="insideLeft"
              fontSize={14}
              fill="#475569"
              fontWeight={600}
            />
          </YAxis>
          <Tooltip
            cursor={{ fill: "rgba(100, 116, 139, 0.1)" }}
            contentStyle={{
              backgroundColor: "#f3f4f6",
              borderColor: "#c7d2fe",
              color: "#1e293b",
              fontSize: "14px",
              borderRadius: "0.5rem",
            }}
          />
          <Bar
            dataKey="total"
            fill="url(#fancyGradient)"
            radius={[6, 6, 0, 0]}
            barSize={28}
          />
          <defs>
            <linearGradient id="fancyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
              <stop offset="50%" stopColor="#6366f1" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.75} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
