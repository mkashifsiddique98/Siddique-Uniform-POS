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
import { Button } from "@/components/ui/button";

export function TableSpecialOrder({ invoiceList }: { invoiceList: Invoice[] }) {
  const Router = useRouter();
  const [specialOrderInvoice, setSpecialOrderInvoice] = useState<Invoice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const pendingInvoices = invoiceList.filter(
      (invoice) => invoice.status === "Pending"
    );

    setSpecialOrderInvoice(pendingInvoices);
  }, [invoiceList]);

  const handleViewClick = (id: string | undefined) => {
    Router.push(`/invoice/view/${id}`);
  };

  const handleCheckClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  };

  const handleConfirmDelivery = async () => {
    if (selectedInvoice) {
      try {
        const response = await fetch("/api/invoice/special_order_edit", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedInvoice._id,
            status: "Delivered",
          }),
        });

        const result = await response.json();

        if (response.ok) {
          // Update the local state with the new status
          const updatedInvoices = specialOrderInvoice.map((inv) =>
            inv._id === selectedInvoice._id
              ? { ...inv, status: "Delivered" }
              : inv
          );
          setSpecialOrderInvoice(updatedInvoices);
          setShowModal(false);
          setSelectedInvoice(null);
        } else {
          console.error(result.error);
        }
      } catch (error) {
        console.error("Error updating invoice status:", error);
      }
    }
  };

  if (specialOrderInvoice.length === 0) {
    return (
      <div className="font-bold flex justify-center items-center h-full w-full">
        No Special Order Found
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Date</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Pending Balance</TableHead>
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
              {invoice?.customer?.customerName && <TableCell className="font-medium">
                {invoice?.customer?.customerName}
              </TableCell>}

              <TableCell className="font-medium">
                {invoice?.customer?.prevBalance}
              </TableCell>
              <TableCell className="font-medium">
                {new Date(
                  invoice?.invoiceDate ?? new Date()
                ).toLocaleDateString()}
              </TableCell>

              <TableCell className="text-center">{invoice?.status}</TableCell>
              <TableCell className="text-center flex gap-1">
                <div
                  title="View"
                  className="p-2  cursor-pointer"
                  onClick={() => handleViewClick(invoice._id)}
                >
                  <View />
                </div>
                <div
                  className="p-2  cursor-pointer"
                  title="Mark as Delivered"
                  onClick={() => handleCheckClick(invoice)}
                >
                  <CheckCheck />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
          <div className="bg-white p-8 rounded-lg w-[400px]">
            <h2 className="text-lg font-semibold mb-4">Confirm Delivery</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Are you sure you want to mark this product as stitched and delivered to the customer?</li>
              <li>Are you sure all balance is clear?</li>
            </ul>

            <div className="flex justify-end mt-4">
              <Button
                className="font-bold py-2 px-4 rounded mr-2"
                onClick={handleConfirmDelivery}
              >
                Confirm
              </Button>
              <Button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
