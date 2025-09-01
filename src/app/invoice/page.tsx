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
  onDelete: (id: string) => void;
}

const TableDemo: React.FC<TableDemoProps> = ({ invoices, onDelete }) => {
  const router = useRouter();

  const handleViewClick = (id: string) => {
    router.push(`/invoice/view/${id}`);
  };

  const confirmDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      onDelete(id);
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
  const today = new Date();

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
      toast({ description: "Invoices updated!" });
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
    const selectedDate = form.getValues("dob").toLocaleDateString();
    return invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString();
      const matchesDate = invoiceDate === selectedDate;
      const matchesName =
        invoice.customer?.customerName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ?? false;
      return matchesDate && matchesName;
    });
  }, [invoices, form.watch("dob"), searchTerm]);

  // Calculate total sale
  const totalDaySale = useMemo(
    () => filteredInvoices.reduce((total, sale) => total + sale.grandTotal, 0),
    [filteredInvoices]
  );

  // Delete handler
  const handleDeleteClick = async (id: string) => {
    try {
      const response = await fetch(`/api/invoice`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ description: "Failed to delete invoice" });
        return;
      }

      setInvoices((prev) => prev.filter((invoice) => invoice._id !== id));
      toast({ description: data.message });
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Sale" subfolder="List Sale" />

      <div className="flex justify-between mb-4 flex-wrap gap-4 items-center">
        <Search searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        <div className="font-extrabold border rounded-md p-2 text-2xl">
          Total Sale of Today : Rs {totalDaySale}
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
        <TableDemo invoices={filteredInvoices} onDelete={handleDeleteClick} />
      ) : (
        <p className="font-extrabold text-center">
          No invoices found for the selected date or customer name.
        </p>
      )}
    </div>
  );
};

export default SaleList;
