"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Wholesale Customer page: invoices, returns and payments received. Invoice data only.
type Detail = {
  profile: { id: string; name: string; schoolName: string; phone: number | null; prevBalance: number };
  totals: { sales: number; returns: number; netSales: number; paymentsReceived: number; prevBalance: number; invoiceCount: number };
  invoices: Array<{ id: string; date: string; invoiceNo: string; summary: string; total: number; status: string; remainingBalance: number }>;
  returns: Array<{ id: string; date: string; invoiceNo: string; summary: string; amount: number }>;
  paymentsReceived: Array<{ sourceId: string; date: string; reference: string; amount: number }>;
  notes: string[];
};

const money = (value: number) => `Rs ${Number(value || 0).toFixed(2)}`;
const dateLabel = (value: string) => format(new Date(value), "dd MMM yyyy");

export default function WholesaleCustomerDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(`/api/customer/wholesale/${params.id}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load wholesale customer");
        setData((await response.json()) as Detail);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load wholesale customer");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [params.id]);

  if (loading) return <main className="space-y-4 p-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></main>;
  if (error || !data) return <main className="p-6"><p className="text-destructive">{error || "Wholesale customer not found"}</p></main>;

  const { profile, totals, invoices, returns, paymentsReceived, notes } = data;
  return (
    <main className="container mx-auto space-y-6 p-4 sm:p-6">
      <Link href="/customer/wholesale"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Wholesale Customers</Button></Link>
      <header className="border-b pb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Wholesale Customer</p>
        <h1 className="text-2xl font-semibold">{profile.name}</h1>
        <p className="text-sm text-muted-foreground">{profile.schoolName || "No school"} · Phone: {profile.phone ?? "-"}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Invoices", totals.invoiceCount],
          ["Total sales", money(totals.sales)],
          ["Returns", money(totals.returns)],
          ["Payments received (est.)", money(totals.paymentsReceived)],
          ["Previous balance", money(totals.prevBalance)],
        ].map(([label, value]) => (
          <div className="rounded-lg border p-3" key={String(label)}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Invoices</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Invoice</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Balance after invoice</TableHead></TableRow></TableHeader>
            <TableBody>
              {invoices.length === 0 && <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">No invoices.</TableCell></TableRow>}
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="whitespace-nowrap">{dateLabel(invoice.date)}</TableCell>
                  <TableCell><Link className="underline-offset-4 hover:underline" href={`/invoice/view/${invoice.id}`}>{invoice.invoiceNo}</Link></TableCell>
                  <TableCell className="min-w-48">{invoice.summary}</TableCell>
                  <TableCell>{money(invoice.total)}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell>{money(invoice.remainingBalance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Returns</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Invoice</TableHead><TableHead>Items</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {returns.length === 0 && <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No returns.</TableCell></TableRow>}
              {returns.map((row) => (
                <TableRow key={`${row.id}-return`}>
                  <TableCell className="whitespace-nowrap">{dateLabel(row.date)}</TableCell>
                  <TableCell><Link className="underline-offset-4 hover:underline" href={`/invoice/view/${row.id}`}>{row.invoiceNo}</Link></TableCell>
                  <TableCell>{row.summary}</TableCell>
                  <TableCell>{money(row.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Payments received</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Invoice</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {paymentsReceived.length === 0 && <TableRow><TableCell colSpan={3} className="h-20 text-center text-muted-foreground">No payments detected.</TableCell></TableRow>}
              {paymentsReceived.map((payment) => (
                <TableRow key={`${payment.sourceId}-payment`}>
                  <TableCell className="whitespace-nowrap">{dateLabel(payment.date)}</TableCell>
                  <TableCell>{payment.reference}</TableCell>
                  <TableCell>{money(payment.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {notes.map((note) => <p key={note} className="text-xs text-muted-foreground">{note}</p>)}
      </section>
    </main>
  );
}
