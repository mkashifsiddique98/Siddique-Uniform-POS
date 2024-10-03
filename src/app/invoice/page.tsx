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
import BreadCrum from "@/components/custom-components/bread-crum";
import { Invoice } from "@/types/invoice";
import { Input } from "@/components/ui/input";
// ***************************************Serach ***********************
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
      className="max-w-72"
    />
  );
};
// Demo Table is mainTable Of
interface TableDemoProps {
  invoices: Invoice[];
}
const TableDemo: React.FC<TableDemoProps> = ({ invoices }) => {
  const router = useRouter();
  const [sortedInvoices, setSortedInvoices] = useState<Invoice[]>([]);

  const handleViewClick = (id: string | undefined) => {
    router.push(`/invoice/view/${id}`);
  };

  const handleDeleteClick = async (id: string | undefined) => {
    try {
      const response = await fetch(`/api/invoice`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          description: "Failed to delete invoice",
        });
      }

      const updatedInvoices = sortedInvoices.filter(
        (invoice) => invoice._id !== id
      );
      setSortedInvoices(updatedInvoices);
      toast({
        description: data.message,
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  useEffect(() => {
    // Sort the invoices by `invoiceDate` in descending order (most recent first)
    const sorted = [...invoices].sort((a, b) => {
      return (
        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
      );
    });
    setSortedInvoices(sorted);
  }, [invoices]);

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
        {sortedInvoices.map((invoice, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>{invoice.customer?.customerName || "Unknown"}</TableCell>
            <TableCell>{invoice.customer?.type || "Unknown"}</TableCell>

            <TableCell className="whitespace-nowrap">
              {new Date(invoice.invoiceDate).toLocaleDateString()}
              <br />
              {new Date(invoice.invoiceDate).toLocaleTimeString()}
            </TableCell>
            <TableCell>Rs {invoice.grandTotal.toFixed(2)}</TableCell>
            <TableCell className="text-center">
              <Button
                variant="outline"
                onClick={() => handleViewClick(invoice._id)}
              >
                View
              </Button>
              <Button
                className="ml-2"
                onClick={() => handleDeleteClick(invoice._id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// *********************************** fetch Server Side ****************
const FormSchema = z.object({
  dob: z.date({
    required_error: "A date is required.",
  }),
});

const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

// Fetching invoices as a separate async function
async function fetchInvoiceData() {
  try {
    const res = await fetch(`${DOMAIN_NAME}/api/invoice/`);
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
  const [searchTerm, setSearchTerm] = useState(""); // State for the search term
  const today = new Date();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      dob: today, // Set the default value to today's date
    },
  });

  // Filter invoices by date and customer name
  const filterInvoices = (date: Date, term: string) => {
    const selectedDate = date.toLocaleDateString();
    const filtered = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString();
      const matchesDate = invoiceDate === selectedDate;
      const matchesName =
        invoice.customer?.customerName
          ?.toLowerCase()
          .includes(term.toLowerCase()) ?? false;

      return matchesDate && matchesName;
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

  // Recalculate filtered invoices and total sales when invoices, date, or search term change
  useEffect(() => {
    if (invoices.length > 0) {
      filterInvoices(today, searchTerm); // Filter by today's date and search term
    }
  }, [invoices, searchTerm]);

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      filterInvoices(date, searchTerm);
    }
  };

  // Handle search input change
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    filterInvoices(form.getValues("dob"), term); // Filter when search term changes
  };

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Sale" subfolder="List Sale" />
      <div className="flex justify-between mb-4">
        {/* Pass search term to the Search component */}
        <Search searchTerm={searchTerm} onSearchChange={handleSearchChange} />
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
          No invoices found for the selected date or customer name.
        </p>
      )}
    </div>
  );
};

export default SaleList;
