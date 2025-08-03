"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: { _id: string; name: string };
  paymentMethod: string;
  handledBy: string;
  createdAt: string;
}

interface CategoryTotal {
  name: string;
  total: number;
}

interface MonthYear {
  month: number;
  year: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ExpenseOverview({ expenses }: { expenses: Expense[] }) {
  const [data, setData] = useState<CategoryTotal[]>([]);
  const [availableDates, setAvailableDates] = useState<MonthYear[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const extractAvailableDates = (expenses: Expense[]): MonthYear[] => {
    const seen = new Set<string>();
    const results: MonthYear[] = [];

    expenses.forEach((expense) => {
      const date = new Date(expense.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ year, month });
      }
    });

    return results.sort((a, b) => a.year - b.year || a.month - b.month);
  };

  const filterAndAggregate = (month: number, year: number) => {
    const filtered = expenses.filter((e) => {
      const d = new Date(e.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const totals: Record<string, number> = {};
    filtered.forEach(({ amount, category }) => {
      if (category?.name) {
        totals[category.name] = (totals[category.name] || 0) + amount;
      }
    });

    const chartData = Object.entries(totals).map(([name, total]) => ({
      name,
      total,
    }));

    setData(chartData);
  };

  useEffect(() => {
    const dates = extractAvailableDates(expenses);
    setAvailableDates(dates);

    if (dates.length > 0) {
      const today = new Date();
      const currentMatch =
        dates.find(
          (d) =>
            d.year === today.getFullYear() &&
            d.month === today.getMonth()
        ) || dates[dates.length - 1];

      setSelectedMonth(currentMatch.month);
      setSelectedYear(currentMatch.year);
      filterAndAggregate(currentMatch.month, currentMatch.year);
    } else {
      setSelectedMonth(null);
      setSelectedYear(null);
      setData([]);
    }
  }, [expenses]);

  // Validate selectedMonth when selectedYear changes
  useEffect(() => {
    if (selectedYear === null || selectedMonth === null) return;

    const validMonths = availableDates
      .filter((d) => d.year === selectedYear)
      .map((d) => d.month);

    if (!validMonths.includes(selectedMonth)) {
      if (validMonths.length > 0) {
        setSelectedMonth(validMonths[0]);
      } else {
        setSelectedMonth(null);
      }
    }
  }, [selectedYear, availableDates]);

  // Refetch data on month or year change
  useEffect(() => {
    if (selectedMonth !== null && selectedYear !== null) {
      filterAndAggregate(selectedMonth, selectedYear);
    }
  }, [selectedMonth, selectedYear]);

  const formatNumber = (value: number) =>
    value >= 1000 ? (value / 1000).toFixed(1) + "K" : value.toString();

  const availableYears = [...new Set(availableDates.map((d) => d.year))];
  const monthsForSelectedYear = availableDates.filter(
    (d) => d.year === selectedYear
  );

  if (selectedMonth === null || selectedYear === null) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        No expense data available
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          💸 Expenses by Category – {monthNames[selectedMonth]} {selectedYear} - 
         Total: Rs{" "}
        {data.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
        </h2>
       
        <div className="flex gap-3 mt-4 sm:mt-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="rounded-md border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          >
            {monthsForSelectedYear.map((d) => (
              <option key={`${d.year}-${d.month}`} value={d.month}>
                {monthNames[d.month]}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-md border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#475569" />
          <YAxis
            stroke="#475569"
            tickFormatter={formatNumber}
            label={{
              value: "Amount (PKR)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "#475569",
              style: { textAnchor: "middle", fontWeight: "600" },
            }}
          />
          <Tooltip formatter={(value: number) => `Rs ${value.toFixed(2)}`} />
          <Bar dataKey="total" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
