"use client";

import React, { useEffect, useState } from "react";
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
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { CalendarIcon } from "lucide-react";
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
import { Search } from "@/components/dashboard/search";
import BreadCrum from "@/components/custom-components/bread-crum";
import { Invoice } from "@/types/invoice";

const FormSchema = z.object({
  dob: z.date({
    required_error: "A date is required.",
  }),
});

const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

// Fetching invoices as a separate async function
async function fetchInvoiceData() {
  try {
    const res = await fetch(`${DOMAIN_NAME}/api/invoice/`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return [];
  }
}

const SaleList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [totalDaySale, setTotalDaySale] = useState<number>(0);
  const today = new Date();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      dob: today, // Set the default value to today's date
    },
  });

  // Filter invoices by date
  const filterInvoicesByDate = (date: Date) => {
    const selectedDate = date.toLocaleDateString();
    const filtered = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString();
      return invoiceDate === selectedDate;
    });
    setFilteredInvoices(filtered);
    calculateTotalSale(filtered);
  };

  // Calculate total sales for the selected date
  const calculateTotalSale = (invoiceList: Invoice[]) => {
    const totalSale = invoiceList.reduce(
      (total, sale) => total + sale.grandTotal,
      0
    );
    setTotalDaySale(totalSale);
  };

  // Load invoices and filter by current date on initial load
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchInvoiceData();
      setInvoices(data.response || []);
    };
    loadData();
  }, []);

  // Recalculate filtered invoices and total sales when invoices or date change
  useEffect(() => {
    if (invoices.length > 0) {
      filterInvoicesByDate(today); // Filter by today's date when invoices are loaded
    }
  }, [invoices]);

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      filterInvoicesByDate(date);
    }
  };

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Sale" subfolder="List Sale" />
      <div className="flex justify-between mb-4">
        <Search />
        <div className="font-extrabold border rounded-md p-2 text-2xl">
          Total Sale of Today : Rs {totalDaySale}
        </div>
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
                        onSelect={(date) => {
                          field.onChange(date);
                          handleDateChange(date);
                        }}
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
      </div>
      {filteredInvoices.length > 0 ? (
        <TableDemo invoices={filteredInvoices} />
      ) : (
        <p className="font-extrabold text-center">
          No invoices found for the selected date.
        </p>
      )}
    </div>
  );
};

export default SaleList;

// Define the Invoice type and TableDemo component


interface TableDemoProps {
  invoices: Invoice[];
}

const TableDemo: React.FC<TableDemoProps> = ({ invoices }) => {
  const router = useRouter();

  const handleViewClick = (id: string | undefined) => {
    router.push(`/invoice/view/${id}`);
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
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>{invoice.customer.customerName}</TableCell>
            <TableCell>{invoice.customer.type}</TableCell>
            <TableCell className="whitespace-nowrap">
              {new Date(invoice.invoiceDate).toLocaleDateString()}
              <br />
              {new Date(invoice.invoiceDate).toLocaleTimeString()}
            </TableCell>
            <TableCell>Rs {invoice.grandTotal.toFixed(2)}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                onClick={() => handleViewClick(invoice._id)}
              >
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
