"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowUpDown, Search } from "lucide-react";
import BreadCrum from "@/components/custom-components/bread-crum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type WholesalerRow = {
  id: string;
  name: string;
  contact: string;
  shop: string;
  totalPurchased: number;
  totalPaid: number;
  outstandingBalance: number;
  orderCount: number;
  lastPurchaseDate: string | null;
};

type ListResponse = {
  rows: WholesalerRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { totalWholesalers: number; totalOutstanding: number; monthPurchases: number };
};

const money = (value: number) => `Rs ${Number(value || 0).toFixed(2)}`;

export default function WholesalersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ search, page: String(page), limit: "20", sort, direction });
        const response = await fetch(`/api/wholesalers?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load wholesalers");
        setData((await response.json()) as ListResponse);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load wholesalers");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [search, page, sort, direction]);

  const toggleSort = (field: string) => {
    if (sort === field) setDirection((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setSort(field);
      setDirection("asc");
    }
  };

  return (
    <main className="container mx-auto space-y-6 p-4 sm:p-6">
      <BreadCrum mainfolder="Wholesalers" subfolder="Overview" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wholesale customers</h1>
        <p className="text-sm text-muted-foreground">Existing records are supplier purchases. Customer sales and payment ledgers are not linked yet.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Wholesaler summary">
        {[
          ["Wholesalers", data?.summary.totalWholesalers ?? 0],
          ["Outstanding supplier balance", money(data?.summary.totalOutstanding ?? 0)],
          ["This month purchases", money(data?.summary.monthPurchases ?? 0)],
        ].map(([label, value]) => (
          <div className="rounded-lg border bg-card p-4" key={String(label)}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Search wholesalers" className="pl-9" placeholder="Search name, phone, or shop" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} />
        </div>
        <p className="text-sm text-muted-foreground">{data?.pagination.total ?? 0} records</p>
      </div>

      {error && <p className="rounded-md border border-destructive/30 p-4 text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Button variant="ghost" onClick={() => toggleSort("name")}>Name <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead><Button variant="ghost" onClick={() => toggleSort("outstanding")}>Outstanding <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Last purchase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }).map((_, index) => <TableRow key={index}><TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell></TableRow>)}
            {!loading && !error && data?.rows.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No wholesalers found.</TableCell></TableRow>}
            {!loading && data?.rows.map((row) => <TableRow key={row.id} className={row.outstandingBalance > 0 ? "bg-amber-50/60" : undefined}>
              <TableCell><Link className="font-medium underline-offset-4 hover:underline" href={`/wholesalers/${row.id}`}>{row.name}</Link></TableCell>
              <TableCell>{row.contact}</TableCell>
              <TableCell>{row.shop}</TableCell>
              <TableCell className={row.outstandingBalance > 0 ? "font-semibold text-amber-700" : ""}>{money(row.outstandingBalance)}</TableCell>
              <TableCell>{row.orderCount}</TableCell>
              <TableCell>{row.lastPurchaseDate ? format(new Date(row.lastPurchaseDate), "dd MMM yyyy") : "-"}</TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <span className="text-sm text-muted-foreground">Page {data?.pagination.page ?? page} of {Math.max(1, data?.pagination.pages ?? 1)}</span>
        <Button variant="outline" disabled={loading || page >= (data?.pagination.pages ?? 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div>
    </main>
  );
}
