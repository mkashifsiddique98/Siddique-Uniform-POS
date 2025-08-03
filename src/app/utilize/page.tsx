"use client";

import React, { useEffect, useState, useMemo } from "react";
import BreadCrum from "@/components/custom-components/bread-crum";
import ExpenseForm from "./FormExpense";
import ExpenseTable from "./ExpenseTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ExpenseCategoriesForm from "./ExpenseCategoriesForm";
import { Utilize } from "@/types/utilize";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const monthNames = [
  "All",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const UtilizePage = () => {
  const [refresh, setRefresh] = useState(false);
  const [data, setData] = useState<Utilize[]>([]);
  const [loading, setLoading] = useState(true);
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [perPageExpense, setPerPageExpense] = useState<number>(7);
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = All
  const [selectedYear, setSelectedYear] = useState<number | "All">("All");

  // Get available years
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(data.map((item) => new Date(item.createdAt).getFullYear()))
    ).sort((a, b) => b - a);
    return ["All", ...years];
  }, [data]);

  // Get months for selected year
  const availableMonthsForYear = useMemo(() => {
    if (selectedYear === "All") return monthNames;

    const monthsSet = new Set<number>();
    data.forEach((item) => {
      const date = new Date(item.createdAt);
      if (date.getFullYear() === selectedYear) {
        monthsSet.add(date.getMonth());
      }
    });
    const monthsArr = Array.from(monthsSet).sort((a, b) => a - b);
    return ["All", ...monthsArr.map((m) => monthNames[m + 1])];
  }, [data, selectedYear]);

  const handleAdd = () => {
    setRefresh((prev) => !prev);
    setOpenExpenseDialog(false);
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/utilize")
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((utilizeData) => {
        setData(utilizeData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        setData([]);
        setLoading(false);
      });
  }, [refresh]);

  // Filter data
  const filteredData = useMemo(() => {
    if (selectedMonth === 0 && selectedYear === "All") return data;

    return data.filter((expense) => {
      const date = new Date(expense.createdAt);
      const yearMatch =
        selectedYear === "All" || date.getFullYear() === selectedYear;
      const monthMatch =
        selectedMonth === 0 ||
        (selectedYear === "All"
          ? date.getMonth() === selectedMonth - 1
          : date.getMonth() ===
            (availableMonthsForYear[selectedMonth] !== "All"
              ? monthNames.indexOf(availableMonthsForYear[selectedMonth]) - 1
              : -1));
      return yearMatch && monthMatch;
    });
  }, [data, selectedMonth, selectedYear, availableMonthsForYear]);

  // Totals
  const { totalToday, totalThisMonth } = useMemo(() => {
    if (!filteredData.length) return { totalToday: 0, totalThisMonth: 0 };

    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    let todayTotal = 0;
    let monthTotal = 0;

    filteredData.forEach((expense) => {
      const expenseDate = new Date(expense.createdAt);
      if (
        expenseDate.getFullYear() === todayYear &&
        expenseDate.getMonth() === todayMonth
      ) {
        monthTotal += expense.amount;
        if (expenseDate.getDate() === todayDate) {
          todayTotal += expense.amount;
        }
      }
    });

    return { totalToday: todayTotal, totalThisMonth: monthTotal };
  }, [filteredData]);

  // Display label for month filter
  const displayMonthLabel = useMemo(() => {
  const now = new Date();

  if (selectedMonth !== 0 && availableMonthsForYear[selectedMonth] !== "All") {
    return availableMonthsForYear[selectedMonth]; // Proper label from filtered months
  }

  // Default to current month name
  return monthNames[now.getMonth() + 1];
}, [selectedMonth, availableMonthsForYear]);


  return (
    <div className="container p-6 space-y-4">
      <BreadCrum mainfolder="Utilize" subfolder="Utilize Management" />

      {/* Top Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Dialog open={openExpenseDialog} onOpenChange={setOpenExpenseDialog}>
          <DialogTrigger asChild>
            <Button>Add New Expense</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm onAdd={handleAdd} />
          </DialogContent>
        </Dialog>

        <Dialog open={openCategoryDialog} onOpenChange={setOpenCategoryDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">Manage Expense Categories</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Expense Categories</DialogTitle>
            </DialogHeader>
            <ExpenseCategoriesForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-4 mt-4 border rounded-xl p-4">
        {/* Month */}
        <div className="flex gap-2 items-center">
          <label className="font-semibold text-gray-700 dark:text-gray-200">
            Filter by Month:
          </label>
          {loading ? (
            <div className="h-10 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          ) : (
            <select
              className="rounded-md border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {availableMonthsForYear.map((monthName, idx) => (
                <option key={idx} value={idx}>
                  {monthName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Year */}
        <div className="flex gap-2 items-center">
          <label className="font-semibold text-gray-700 dark:text-gray-200">
            Filter by Year:
          </label>
          {loading ? (
            <div className="h-10 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          ) : (
            <select
              className="rounded-md border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value === "All" ? "All" : Number(e.target.value)
                )
              }
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Per Page */}
        <div className="flex items-center gap-2 ">
          <label htmlFor="perPageInput" className=" font-semibold text-gray-700 dark:text-gray-200">
            Per Page
          </label>
          <Input
            id="perPageInput"
            className="w-16"
            type="number"
            min={1}
            value={perPageExpense}
            onChange={(e) => {
              const value = Number(e.target.value);
              setPerPageExpense(value >= 1 ? value : 7);
            }}
          />
        </div>

        {/* Totals */}
        <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Total Expense Today: Rs {totalToday.toFixed(0)}
        </span>
        <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Total Expense {displayMonthLabel}: Rs {totalThisMonth.toFixed(0)}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2 mt-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
            />
          ))}
        </div>
      ) : (
        <ExpenseTable
          refresh={refresh}
          data={filteredData}
          setData={setData}
          ITEMS_PER_PAGE={perPageExpense}
        />
      )}
    </div>
  );
};

export default UtilizePage;
