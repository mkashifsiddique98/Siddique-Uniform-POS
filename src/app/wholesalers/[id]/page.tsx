"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Supplier (Wholesaler) page: purchases from the supplier and payments made to them only.
type Profile = { id: string; name: string; phone: string; location: string; paymentStatus: string; pendingBalance: number };
type Totals = { purchased: number; paid: number; paymentsMade: number; pendingBalance: number; purchaseCount: number };
type PurchaseRow = {
  id: string;
  date: string;
  isPaid: boolean;
  paidAtPurchase: number;
  total: number;
  products: Array<{ productName: string; quantity: number; cost: number; lineTotal: number }>;
};
type PaymentRow = { id: string; date: string; amount: number; note: string };
type Detail = { profile: Profile; totals: Totals; purchases: PurchaseRow[]; payments: PaymentRow[] };

const money = (value: number) => `Rs ${Number(value || 0).toFixed(2)}`;
const dateLabel = (value: string) => format(new Date(value), "dd MMM yyyy");

export default function SupplierDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/wholesalers/${params.id}`, { signal });
      if (!response.ok) throw new Error("Unable to load supplier");
      setData((await response.json()) as Detail);
      setError("");
    } catch (loadError) {
      if (!signal?.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load supplier");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const response = await fetch(`/api/wholesalers/${params.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), date: new Date(`${paymentDate}T12:00:00`).toISOString(), note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to record payment");
      setAmount("");
      setNote("");
      await load();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to record payment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="space-y-4 p-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></main>;
  if (error || !data) return <main className="p-6"><p className="text-destructive">{error || "Supplier not found"}</p></main>;

  const { profile, totals, purchases, payments } = data;
  return (
    <main className="container mx-auto space-y-6 p-4 sm:p-6 print:p-0">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/wholesalers"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Suppliers (Wholesalers)</Button></Link>
        <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
      </div>

      <header className="border-b pb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Supplier (Wholesaler)</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">Phone: {profile.phone} · Location: {profile.location}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm ${profile.pendingBalance > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
            {money(profile.pendingBalance)} pending
          </span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Supplier totals">
        {[
          ["Total purchased", money(totals.purchased)],
          ["Paid (purchases + payments)", money(totals.paid)],
          ["Payments made later", money(totals.paymentsMade)],
          ["Pending balance", money(totals.pendingBalance)],
          ["Purchases", totals.purchaseCount],
        ].map(([label, value]) => (
          <div className="rounded-lg border p-3" key={String(label)}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Purchases</h2>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 && <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">No purchases from this supplier.</TableCell></TableRow>}
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="whitespace-nowrap align-top">{dateLabel(purchase.date)}</TableCell>
                  <TableCell className="align-top">{purchase.products.map((product, index) => <div key={index}>{product.productName}</div>)}</TableCell>
                  <TableCell className="align-top">{purchase.products.map((product, index) => <div key={index}>{product.quantity}</div>)}</TableCell>
                  <TableCell className="align-top">{purchase.products.map((product, index) => <div key={index}>{money(product.cost)}</div>)}</TableCell>
                  <TableCell className="align-top font-medium">{money(purchase.total)}</TableCell>
                  <TableCell className="align-top">{purchase.isPaid ? "Paid" : money(purchase.paidAtPurchase)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Payments to supplier</h2>
        <form onSubmit={submitPayment} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-end print:hidden">
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="pay-amount">Amount</label>
            <Input id="pay-amount" type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="pay-date">Date</label>
            <Input id="pay-date" type="date" required value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground" htmlFor="pay-note">Note</label>
            <Input id="pay-note" maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          <Button type="submit" disabled={saving || profile.pendingBalance <= 0}>{saving ? "Saving..." : "Record payment"}</Button>
        </form>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.length === 0 && <TableRow><TableCell colSpan={3} className="h-20 text-center text-muted-foreground">No payments recorded yet.</TableCell></TableRow>}
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="whitespace-nowrap">{dateLabel(payment.date)}</TableCell>
                  <TableCell>{money(payment.amount)}</TableCell>
                  <TableCell>{payment.note || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
