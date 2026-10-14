"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import BreadCrum from "@/components/custom-components/bread-crum";
import { Invoice } from "@/types/invoice";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
<<<<<<< HEAD
import { Badge } from "@/components/ui/badge";
import { isVoided, resolveReturnStatus, summarizeInvoice } from "@/lib/posHelpers";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { useStockSync } from "@/app/pos/useStockSync";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

// *************************************** Search ***********************
interface SearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const Search: React.FC<SearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <Input
      type="text"
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder="Search by customer name e.g wake-in"
      className="max-w-80"
    />
  );
};

// *************************************** Table ***********************
interface TableDemoProps {
  invoices: Invoice[];
<<<<<<< HEAD
  onDelete: (id: string, confirmed: boolean) => void;
  onVoid: (id: string) => void;
  isAdmin: boolean;
}

// Same numbers as the view page, receipt and the saved total: all come from summarizeInvoice
const invoiceNumbers = (invoice: Invoice) =>
  summarizeInvoice({ items: invoice.productDetail || [], discount: invoice.discount || 0 });

const TableDemo: React.FC<TableDemoProps> = ({ invoices, onDelete, onVoid, isAdmin }) => {
=======
  onDelete: (id: string) => void;
}

const TableDemo: React.FC<TableDemoProps> = ({ invoices, onDelete }) => {
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  const router = useRouter();

  const handleViewClick = (id: string) => {
    router.push(`/invoice/view/${id}`);
  };

<<<<<<< HEAD
  const confirmDelete = (invoice: Invoice) => {
    const hasLines = (invoice.productDetail || []).length > 0;
    const message = hasLines
      ? `Invoice #${invoice.invoiceNo} has items. Deleting it puts sold items back in stock and takes returned items out again. The invoice number stays reserved. Delete it?`
      : "Are you sure you want to delete this empty invoice?";
    if (window.confirm(message)) {
      onDelete(invoice._id as string, hasLines);
    }
  };

  const confirmVoid = (invoice: Invoice) => {
    if (window.confirm(`Void invoice #${invoice.invoiceNo}? Its stock is restored and it stays on record as void.`)) {
      onVoid(invoice._id as string);
=======
  const confirmDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      onDelete(id);
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">#</TableHead>
          <TableHead>Customer Name</TableHead>
          <TableHead>Customer Type</TableHead>
          <TableHead>Invoice Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead className="text-center">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
<<<<<<< HEAD
        {invoices.map((invoice) => {
          const numbers = invoiceNumbers(invoice);
          const returnStatus = resolveReturnStatus(invoice);
          const voided = isVoided(invoice);
          const hasLines = (invoice.productDetail || []).length > 0;
          const canDelete = !hasLines || isAdmin;
          return (
            <TableRow key={invoice._id}>
              <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
              <TableCell>{invoice.customer?.customerName || "Unknown"}</TableCell>
              <TableCell>{invoice.customer?.type || "Unknown"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {format(new Date(invoice.invoiceDate), "dd MMM yyyy, hh:mm a")}
              </TableCell>
              <TableCell>
                <span className={voided ? "line-through" : undefined}>Rs {numbers.grandTotal.toFixed(2)}</span>
                {numbers.refundedAmount > 0 && (
                  <div className="text-xs text-red-600">Refunded: -Rs {numbers.refundedAmount.toFixed(2)}</div>
                )}
                {voided && <Badge variant="destructive" className="ml-2">Void</Badge>}
                {!voided && returnStatus === "fully_returned" && (
                  <Badge variant="destructive" className="ml-2">Fully returned</Badge>
                )}
                {!voided && returnStatus === "partially_returned" && (
                  <Badge variant="outline" className="ml-2">Partially returned</Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Button variant="outline" onClick={() => handleViewClick(invoice._id as string)}>
                  View
                </Button>
                <span
                  className="ml-2 inline-block"
                  title={canDelete ? undefined : "Only an admin can delete an invoice that has items"}
                >
                  <Button disabled={!canDelete} onClick={() => confirmDelete(invoice)}>
                    Delete
                  </Button>
                </span>
                {isAdmin && !voided && hasLines && (
                  <Button variant="outline" className="ml-2" onClick={() => confirmVoid(invoice)}>
                    Void
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
=======
        {invoices.map((invoice) => (
          <TableRow key={invoice._id}>
            <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
            <TableCell>{invoice.customer?.customerName || "Unknown"}</TableCell>
            <TableCell>{invoice.customer?.type || "Unknown"}</TableCell>
            <TableCell className="whitespace-nowrap">
              {format(new Date(invoice.invoiceDate), "dd MMM yyyy, hh:mm a")}
            </TableCell>
            <TableCell>Rs {invoice.grandTotal.toFixed(2)}</TableCell>
            <TableCell className="text-center">
              <Button variant="outline" onClick={() => handleViewClick(invoice._id)}>
                View
              </Button>
              <Button className="ml-2" onClick={() => confirmDelete(invoice._id)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
      </TableBody>
    </Table>
  );
};

// *********************************** Schema ****************
const FormSchema = z.object({
  dob: z.date({
    required_error: "A date is required.",
  }),
});

const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

// Fetch helper
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}

// *********************************** Main Component ****************
const SaleList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
<<<<<<< HEAD
  const isAdmin = useIsAdmin();
  const { refreshStock } = useStockSync();
  const today = new Date();
=======
  const today = new Date();

>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      dob: today,
    },
  });

  // Fetch invoices
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<{ response: Invoice[] }>(
        `${DOMAIN_NAME}/api/invoice/`
      );
      setInvoices(data.response || []);
      // toast({ description: "Invoices updated!" });
    } catch (error: any) {
      console.error("Failed to fetch invoices:", error.message);
      toast({ description: "Failed to fetch invoices" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter invoices by date + search term
  const filteredInvoices = useMemo(() => {
  const dob = form.getValues("dob");

  // If dob is missing, return all invoices or empty array (your choice)
  if (!dob) return invoices;

  const selectedDate = new Date(dob).toLocaleDateString();

  return invoices.filter((invoice) => {
    // Safely handle invoice date
    const invoiceDateValue = invoice?.invoiceDate
      ? new Date(invoice.invoiceDate)
      : null;

    const invoiceDate = invoiceDateValue
      ? invoiceDateValue.toLocaleDateString()
      : "";

    const matchesDate = invoiceDate === selectedDate;

    // Safely handle name search
    const customerName = invoice?.customer?.customerName ?? "";
    const matchesName = customerName
      .toLowerCase()
      .includes((searchTerm ?? "").toLowerCase());

    return matchesDate && matchesName;
  });
}, [invoices, form.watch("dob"), searchTerm]);


<<<<<<< HEAD
  // Calculate total sale: net of returns, void invoices excluded
  const totalDaySale = useMemo(
    () =>
      filteredInvoices.reduce(
        (total, sale) => (isVoided(sale) ? total : total + invoiceNumbers(sale).grandTotal),
        0
      ),
=======
  // Calculate total sale
  const totalDaySale = useMemo(
    () => filteredInvoices.reduce((total, sale) => total + sale.grandTotal, 0),
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    [filteredInvoices]
  );

  // Delete handler
<<<<<<< HEAD
  const handleDeleteClick = async (id: string, confirmed: boolean) => {
=======
  const handleDeleteClick = async (id: string) => {
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    try {
      const response = await fetch(`/api/invoice`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        body: JSON.stringify({ id, confirm: confirmed }),
=======
        body: JSON.stringify({ id }),
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
      });

      const data = await response.json();

      if (!response.ok) {
<<<<<<< HEAD
        toast({ description: data?.error || "Failed to delete invoice" });
=======
        toast({ description: "Failed to delete invoice" });
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
        return;
      }

      setInvoices((prev) => prev.filter((invoice) => invoice._id !== id));
      toast({ description: data.message });
<<<<<<< HEAD
      refreshStock();
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

<<<<<<< HEAD
  const handleVoidClick = async (id: string) => {
    try {
      const response = await fetch(`/api/invoice/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({ description: data?.error || "Failed to void invoice" });
        return;
      }

      setInvoices((prev) => prev.map((invoice) => (invoice._id === id ? { ...invoice, voided: true } : invoice)));
      toast({ description: data.message });
      refreshStock();
    } catch (error) {
      console.error("Error voiding invoice:", error);
    }
  };

=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Sale" subfolder="List Sale" />

      <div className="flex justify-between mb-4 flex-wrap gap-4 items-center">
        <Search searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <div className="font-extrabold border rounded-md p-2 text-2xl">
          Total Sale of Today : Rs {totalDaySale.toFixed(2)}
        </div>
        <div className="flex gap-2 items-center">
          {/* Date Picker */}
          <Form {...form}>
            <form className="space-y-8">
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? format(field.value, "PPP")
                              : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => field.onChange(date)}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2024-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {/* Refresh Button */}
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2 animate-spin-slow" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-10"
            ></Skeleton>
          ))}
        </div>
      ) : filteredInvoices.length > 0 ? (
<<<<<<< HEAD
        <TableDemo
          invoices={filteredInvoices}
          onDelete={handleDeleteClick}
          onVoid={handleVoidClick}
          isAdmin={isAdmin}
        />
=======
        <TableDemo invoices={filteredInvoices} onDelete={handleDeleteClick} />
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
      ) : (
        <p className="font-extrabold text-center">
          No invoices found for the selected date or customer name.
        </p>
      )}
    </div>
  );
};

export default SaleList;
