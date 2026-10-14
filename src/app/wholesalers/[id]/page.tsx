"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format, startOfMonth, subMonths, startOfYear } from "date-fns";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Profile = { id: string; name: string; contact: string; shop: string; paymentStatus: string; outstandingBalance: number };
type Kpis = { lifetimeNetSales: number; lifetimeNetPurchases: number; orderCount: number; averageOrderValue: number; returnRate: number; outstandingBalance: number; firstPurchaseDate: string | null; lastPurchaseDate: string | null };
type LedgerRow = { date: string; type: "purchase" | "sale" | "return" | "payment"; reference: string; summary: string; debit: number; credit: number; balance: number; sourceId: string };
type ProductRow = { productId: string | null; productName: string; quantity: number; value: number };
type HistoryResponse = { rows: LedgerRow[]; totals: { purchased: number; paid: number; outstanding: number }; openingBalance: number; pagination: { page: number; limit: number; total: number; pages: number } };
type SalesHistoryResponse = { rows: LedgerRow[]; totals: { sales: number; returns: number; netSales: number; outstanding: number; payments: number }; openingBalance: number; pagination: { page: number; limit: number; total: number; pages: number }; matching?: { method: string; ambiguous: boolean; candidateCount: number; note: string }; dataGaps?: string[] };

const money = (value: number) => `Rs ${Number(value || 0).toFixed(2)}`;
const dateLabel = (value: string | null) => value ? format(new Date(value), "dd MMM yyyy") : "-";

export default function WholesalerDetailPage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [salesHistory, setSalesHistory] = useState<SalesHistoryResponse | null>(null);
  const [tab, setTab] = useState<"statement" | "sales-returns" | "orders" | "returns" | "payments" | "products">("statement");
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const historyType = tab === "orders" ? "purchase" : tab === "payments" ? "payment" : "all";
  const salesHistoryType = tab === "returns" ? "return" : tab === "payments" ? "payment" : "all";

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const supplierQuery = new URLSearchParams({ page: String(page), limit: "25", type: historyType });
        const salesQuery = new URLSearchParams({ page: String(page), limit: "25", type: salesHistoryType });
        if (from) {
          const start = new Date(`${from}T00:00:00`).toISOString();
          supplierQuery.set("from", start);
          salesQuery.set("from", start);
        }
        if (to) {
          const end = new Date(`${to}T23:59:59.999`).toISOString();
          supplierQuery.set("to", end);
          salesQuery.set("to", end);
        }
        const [detailResponse, historyResponse, salesResponse, productsResponse] = await Promise.all([
          fetch(`/api/wholesalers/${params.id}`, { signal: controller.signal }),
          fetch(`/api/wholesalers/${params.id}/history?${supplierQuery}`, { signal: controller.signal }),
          fetch(`/api/wholesalers/${params.id}/sales-history?${salesQuery}`, { signal: controller.signal }),
          fetch(`/api/wholesalers/${params.id}/products`, { signal: controller.signal }),
        ]);
        if (!detailResponse.ok || !historyResponse.ok || !salesResponse.ok || !productsResponse.ok) throw new Error("Unable to load wholesaler history");
        const detail = await detailResponse.json() as { profile: Profile; kpis: Kpis };
        setProfile(detail.profile);
        setKpis(detail.kpis);
        setHistory(await historyResponse.json() as HistoryResponse);
        setSalesHistory(await salesResponse.json() as SalesHistoryResponse);
        const productData = await productsResponse.json() as { rows: ProductRow[] };
        setProducts(productData.rows || []);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load wholesaler history");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [params.id, page, from, to, historyType, salesHistoryType]);

  const setPreset = (preset: string) => {
    const today = new Date();
    if (preset === "month") setFrom(format(startOfMonth(today), "yyyy-MM-dd"));
    if (preset === "three") setFrom(format(subMonths(today, 3), "yyyy-MM-dd"));
    if (preset === "year") setFrom(format(startOfYear(today), "yyyy-MM-dd"));
    if (preset === "all") setFrom("");
    setTo(preset === "all" ? "" : format(today, "yyyy-MM-dd"));
    setPage(1);
  };

  const exportCsv = async () => {
    const allRows: LedgerRow[] = [];
    let currentPage = 1;
    let totalPages = 1;
    while (currentPage <= totalPages) {
      const isCustomerExport = ["sales-returns", "returns", "payments"].includes(tab);
      const exportType = isCustomerExport ? salesHistoryType : historyType;
      const query = new URLSearchParams({ page: String(currentPage), limit: "100", type: exportType });
      if (from) query.set("from", new Date(`${from}T00:00:00`).toISOString());
      if (to) query.set("to", new Date(`${to}T23:59:59.999`).toISOString());
      const endpoint = ["sales-returns", "returns", "payments"].includes(tab) ? "sales-history" : "history";
      const response = await fetch(`/api/wholesalers/${params.id}/${endpoint}?${query}`);
      if (!response.ok) throw new Error("Export failed");
      const result = await response.json() as HistoryResponse;
      allRows.push(...result.rows);
      totalPages = result.pagination.pages;
      currentPage += 1;
    }
    const csv = ["Date,Type,Reference,Summary,Debit,Credit,Balance", ...allRows.map((row) => [row.date, row.type, row.reference, `"${row.summary.replaceAll('"', '""')}"`, row.debit, row.credit, row.balance].join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${profile?.name || "wholesaler"}-statement.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printStatement = () => window.print();

  if (loading && !profile) return <main className="space-y-4 p-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></main>;
  if (error && !profile) return <main className="p-6"><p className="text-destructive">{error}</p></main>;
  if (!profile || !kpis) return null;

  const isCustomerHistory = ["sales-returns", "returns", "payments"].includes(tab);
  const visibleRows = isCustomerHistory ? (salesHistory?.rows || []) : (history?.rows || []);
  const visiblePagination = isCustomerHistory ? salesHistory?.pagination : history?.pagination;
  return (
    <main className="container mx-auto space-y-6 p-4 sm:p-6 print:p-0">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/wholesalers"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Wholesalers</Button></Link>
        <div className="flex gap-2"><Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />CSV</Button><Button variant="outline" onClick={printStatement}><Printer className="mr-2 h-4 w-4" />Print</Button></div>
      </div>
      <header className="border-b pb-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">{profile.name}</h1><p className="text-sm text-muted-foreground">{profile.contact} · {profile.shop}</p></div><span className={`rounded-full px-3 py-1 text-sm ${profile.outstandingBalance > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{money(profile.outstandingBalance)} outstanding</span></div></header>
      <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[["Net purchases", money(kpis.lifetimeNetPurchases)], ["Orders", kpis.orderCount], ["Average order", money(kpis.averageOrderValue)], ["Outstanding", money(kpis.outstandingBalance)], ["First purchase", dateLabel(kpis.firstPurchaseDate)], ["Last purchase", dateLabel(kpis.lastPurchaseDate)]].map(([label, value]) => <div className="rounded-lg border p-3" key={String(label)}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}
      </section>
      <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">Supplier purchases and invoice customer history are separate. Invoice history is matched by phone when possible, otherwise by name; it is not a stored customer reference.</p>
      {salesHistory?.matching?.note && <p className="text-xs text-muted-foreground">Invoice match: {salesHistory.matching.note}</p>}
      <div className="flex flex-wrap gap-2 print:hidden" role="tablist" aria-label="Wholesaler views">
        {(["statement", "sales-returns", "orders", "returns", "payments", "products"] as const).map((value) => <Button key={value} variant={tab === value ? "default" : "outline"} onClick={() => { setTab(value); setPage(1); }} role="tab" aria-selected={tab === value}>{value === "sales-returns" ? "Sales & Returns" : value[0].toUpperCase() + value.slice(1)}</Button>)}
      </div>
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end print:hidden"><div><label className="text-xs text-muted-foreground" htmlFor="from">From</label><input id="from" type="date" className="mt-1 block rounded-md border px-3 py-2 text-sm" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></div><div><label className="text-xs text-muted-foreground" htmlFor="to">To</label><input id="to" type="date" className="mt-1 block rounded-md border px-3 py-2 text-sm" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></div><div className="flex flex-wrap gap-2">{[["month", "This month"], ["three", "3 months"], ["year", "This year"], ["all", "All time"]].map(([value, label]) => <Button key={value} size="sm" variant="ghost" onClick={() => setPreset(value)}>{label}</Button>)}</div></div>
      {tab === "products" ? <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead>Value</TableHead></TableRow></TableHeader><TableBody>{products.map((product) => <TableRow key={`${product.productId}-${product.productName}`}><TableCell>{product.productName}</TableCell><TableCell>{product.quantity}</TableCell><TableCell>{money(product.value)}</TableCell></TableRow>)}</TableBody></Table></div> : tab === "payments" ? <div className="rounded-lg border p-6 text-sm text-muted-foreground">No payment history is available. The invoice model stores status and due date, but does not store received amounts or payment records.</div> : <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Reference</TableHead><TableHead>Summary</TableHead><TableHead>Debit</TableHead><TableHead>Credit</TableHead><TableHead>Balance</TableHead></TableRow></TableHeader><TableBody>{visibleRows.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">{tab === "returns" ? "No persisted return line records found." : "No history found."}</TableCell></TableRow> : visibleRows.map((row, index) => <TableRow key={`${row.sourceId}-${row.type}-${index}`}><TableCell className="whitespace-nowrap">{format(new Date(row.date), "dd MMM yyyy, HH:mm")}</TableCell><TableCell className="capitalize">{row.type}</TableCell><TableCell><Link className="underline-offset-4 hover:underline" href={`/invoice/view/${row.sourceId}`}>{row.reference.slice(-8)}</Link></TableCell><TableCell className="min-w-48">{row.summary}</TableCell><TableCell>{row.debit ? money(row.debit) : "-"}</TableCell><TableCell>{row.credit ? money(row.credit) : "-"}</TableCell><TableCell className="font-medium">{money(row.balance)}</TableCell></TableRow>)}</TableBody></Table></div>}
      {tab !== "products" && tab !== "payments" && <div className="flex items-center justify-between print:hidden"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="text-sm text-muted-foreground">Page {visiblePagination?.page || page} of {Math.max(1, visiblePagination?.pages || 1)}</span><Button variant="outline" disabled={page >= (visiblePagination?.pages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button></div>}
    </main>
  );
}
