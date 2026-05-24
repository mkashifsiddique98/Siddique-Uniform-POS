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

  // IMPORTANT
  const [selectedMonth, setSelectedMonth] = useState<number>(-1); // -1 = All
  const [selectedYear, setSelectedYear] = useState<number | "All">("All");

  const handleAdd = () => {
    setRefresh((prev) => !prev);
    setOpenExpenseDialog(false);
  };

  // ================= Fetch =================
  const fetchUtilizeAndCategories = async () => {
    try {
      const [utilizeRes, categoriesRes] = await Promise.all([
        fetch("/api/utilize"),
        fetch("/api/utilize/expense-categories"),
      ]);

      if (!utilizeRes.ok || !categoriesRes.ok) throw new Error("Fetch failed");

      const [utilizeData, categoryData] = await Promise.all([
        utilizeRes.json(),
        categoriesRes.json(),
      ]);

      const categoryMap = categoryData.reduce(
        (
          acc: Record<string, string>,
          category: { _id: string; name: string },
        ) => {
          acc[category._id] = category.name;
          return acc;
        },
        {},
      );

      const updated = utilizeData.map((item: Utilize) => ({
        ...item,
        category: categoryMap[item.category] || "Unknown Category",
      }));

      setData(updated);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setData([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchUtilizeAndCategories();
  }, [refresh]);

  // ================= Available Years =================
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(data.map((d) => new Date(d.createdAt).getFullYear())),
    ).sort((a, b) => b - a);

    return ["All", ...years];
  }, [data]);

  // ================= Available Months =================
  const availableMonths = useMemo(() => {
    const set = new Set<number>();

    data.forEach((item) => {
      const date = new Date(item.createdAt);
      if (selectedYear === "All" || date.getFullYear() === selectedYear)
        set.add(date.getMonth());
    });

    const arr = Array.from(set).sort();

    return [
      { label: "All", value: -1 },
      ...arr.map((m) => ({
        label: monthNames[m],
        value: m,
      })),
    ];
  }, [data, selectedYear]);

  // ================= Filter =================
  const filteredData = useMemo(() => {
    return data.filter((expense) => {
      const date = new Date(expense.createdAt);

      const yearMatch =
        selectedYear === "All" || date.getFullYear() === selectedYear;

      const monthMatch =
        selectedMonth === -1 || date.getMonth() === selectedMonth;

      return yearMatch && monthMatch;
    });
  }, [data, selectedMonth, selectedYear]);

  // ================= Totals =================
  const { totalToday, totalThisMonth } = useMemo(() => {
    const now = new Date();

    let today = 0;
    let month = 0;

    filteredData.forEach((exp) => {
      const d = new Date(exp.createdAt);

      if (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      ) {
        month += exp.amount;
        if (d.getDate() === now.getDate()) today += exp.amount;
      }
    });

    return { totalToday: today, totalThisMonth: month };
  }, [filteredData]);

  const displayMonthLabel =
    selectedMonth === -1
      ? monthNames[new Date().getMonth()]
      : monthNames[selectedMonth];

  // ================= UI =================
  return (
    <div className="container p-6 space-y-4">
      <BreadCrum mainfolder="Utilize" subfolder="Utilize Management" />

      {/* Buttons */}
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
      <div className="flex flex-wrap gap-4 mt-4 border rounded-xl p-4">
         {/* Year */}
        <div className="flex gap-2 items-center">
          <label className="font-semibold">Year:</label>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={selectedYear}
            onChange={(e) => {
              const year =
                e.target.value === "All" ? "All" : Number(e.target.value);

              setSelectedYear(year);
              setSelectedMonth(-1); // reset month
            }}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        {/* Month */}
        <div className="flex gap-2 items-center">
          <label className="font-semibold">Month:</label>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

       

        {/* Per Page */}
        <div className="flex items-center gap-2">
          <label>Per Page</label>
          <Input
            className="w-16"
            type="number"
            min={1}
            value={perPageExpense}
            onChange={(e) =>
              setPerPageExpense(Math.max(1, Number(e.target.value)))
            }
          />
        </div>

        {/* Totals */}
        <div className="flex items-center gap-2">
          <span className="font-semibold ">
            Today: Rs {totalToday.toFixed(0)}
          </span>

          <span className="font-semibold">
            {displayMonthLabel}: Rs {totalThisMonth.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2 mt-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-300 rounded animate-pulse" />
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
