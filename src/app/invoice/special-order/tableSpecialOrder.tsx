"use client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Invoice } from "@/types/invoice";
import { View } from "lucide-react";
import { useEffect, useState } from "react";
import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function TableSpecialOrder({ invoiceList }: { invoiceList: Invoice[] }) {
  const Router = useRouter();
  const [specialOrderInvoice, setSpecialOrderInvoice] = useState<Invoice[]>([]);
  useEffect(() => {
    const pendingInvoices = invoiceList.filter(
      (invoice) => invoice.status === "Pending"
    );

    setSpecialOrderInvoice(pendingInvoices);
  }, [invoiceList]);
  const handleViewClick = (id: string | undefined) => {
    Router.push(`/invoice/view/${id}`);
  };
  if (specialOrderInvoice.length === 0) {
    return <div className="font-bold flex justify-center items-center h-full w-full">No Special Order Found</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order Date</TableHead>
          <TableHead>Customer Name</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-left">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {specialOrderInvoice.map((invoice, index) => (
          <TableRow key={invoice._id}>
            <TableCell className="font-medium">
              {new Date(invoice.invoiceDate).toLocaleDateString()}
            </TableCell>
            <TableCell className="font-medium">
              {invoice.customer.customerName}
            </TableCell>
            <TableCell>{new Date(invoice.dueDate).toDateString()}</TableCell>
            <TableCell className="text-center">{invoice.status}</TableCell>
            <TableCell className="text-center flex gap-1">
              <div
                title="View"
                className="p-2  cursor-pointer"
                onClick={() => handleViewClick(invoice._id)}
              >
                <View />
              </div>
              <div className="p-2  cursor-pointer" title="status">
                <CheckCheck />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
