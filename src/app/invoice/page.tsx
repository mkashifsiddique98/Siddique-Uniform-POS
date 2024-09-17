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
  FormLabel,
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Search } from "@/components/dashboard/search";
import BreadCrum from "@/components/custom-components/bread-crum";

const FormSchema = z.object({
  dob: z.date({
    required_error: "A date is required.",
  }),
});

const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

// Fetching invoices as a separate async function
async function fetchInvoiceData() {
  try {
    const res = await fetch(`${DOMAIN_NAME}/api/invoice/`, { cache: "no-store" });
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
  

  useEffect(() => {
    async function loadData() {
      const data = await fetchInvoiceData();
      setInvoices(data.response || []); // Handle missing response
    }
    loadData();
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  };

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Sale" subfolder="List Sale" />
      <div className="flex justify-between mb-4">
        <Search />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("2024-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    List Date to view Specific Day Sales
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {invoices.length > 0 ? (
        <TableDemo invoices={invoices} />
      ) : (
        <p>No invoices found.</p>
      )}
    </div>
  );
};

export default SaleList;

type Invoice = {
  _id: string;
  customerName: string;
  customerId: string;
  customerType: string;
  invoiceDate: string;
  grandTotal: number;
};

interface TableDemoProps {
  invoices: Invoice[];
}

const TableDemo: React.FC<TableDemoProps> = ({ invoices }) => {
  const router = useRouter();

  const handleViewClick = (id: string) => {
    router.push(`/invoice/view/${id}`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">#</TableHead>
          <TableHead>Customer ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Invoice Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice, index) => (
          <TableRow key={invoice._id}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>{invoice.customerId}</TableCell>
            <TableCell>{invoice.customerType}</TableCell>
            <TableCell>
              {new Date(invoice.invoiceDate).toLocaleDateString()}
              <br/>
              {new Date(invoice.invoiceDate).toLocaleTimeString()}
            </TableCell>
            <TableCell>Rs {invoice.grandTotal}</TableCell>
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
