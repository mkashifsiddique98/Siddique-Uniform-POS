"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import BreadCrum from "@/components/custom-components/bread-crum";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = { id: string; name: string; schoolName: string; phone: number | null; prevBalance: number; invoiceCount: number; totalInvoiced: number; lastInvoiceDate: string | null };

const money = (value: number) => `Rs ${Number(value || 0).toFixed(2)}`;

export default function WholesaleCustomersPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/customer/wholesale?${new URLSearchParams({ search })}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load wholesale customers");
        setRows(((await response.json()) as { rows: Row[] }).rows);
        setError("");
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load wholesale customers");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [search]);

  return (
    <main className="container mx-auto space-y-6 p-4 sm:p-6">
      <BreadCrum mainfolder="Customer" subfolder="Wholesale Customers" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wholesale Customers</h1>
        <p className="text-sm text-muted-foreground">Customers who buy from the shop at wholesale prices. Suppliers you buy stock from are under Suppliers (Wholesalers).</p>
      </div>
      <Input aria-label="Search wholesale customers" className="max-w-sm" placeholder="Search name or school" value={search} onChange={(event) => setSearch(event.target.value)} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>School</TableHead><TableHead>Phone</TableHead>
              <TableHead>Invoices</TableHead><TableHead>Total invoiced</TableHead><TableHead>Previous balance</TableHead><TableHead>Last invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell></TableRow>}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No wholesale customers found.</TableCell></TableRow>}
            {!loading && rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell><Link className="font-medium underline-offset-4 hover:underline" href={`/customer/wholesale/${row.id}`}>{row.name}</Link></TableCell>
                <TableCell>{row.schoolName || "-"}</TableCell>
                <TableCell>{row.phone ?? "-"}</TableCell>
                <TableCell>{row.invoiceCount}</TableCell>
                <TableCell>{money(row.totalInvoiced)}</TableCell>
                <TableCell className={row.prevBalance > 0 ? "font-semibold text-amber-700" : ""}>{money(row.prevBalance)}</TableCell>
                <TableCell>{row.lastInvoiceDate ? format(new Date(row.lastInvoiceDate), "dd MMM yyyy") : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
