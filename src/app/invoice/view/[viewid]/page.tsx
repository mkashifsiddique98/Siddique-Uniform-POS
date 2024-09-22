"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Invoice, ProductDetail } from "@/types/invoice";
import { Skeleton } from "@/components/ui/skeleton";

const InvoiceDetail: React.FC<{ params: { viewid: string } }> = ({
  params,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { viewid } = params;

  const getInvoiceById = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoice/GET_BY_ID/${invoiceId}`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      const data = await res.json();
      const { response } = data;
      if (response) setInvoice(response);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewid) {
      getInvoiceById(viewid);
    }
  }, [viewid]);

  if (loading) {
    return (
      <div className="w-full">
        {/* Table Header Skeleton */}
        <div className="flex items-center space-x-4 p-4">
          <Skeleton className="h-4 w-1/6" /> {/* Column 1 */}
          <Skeleton className="h-4 w-1/6" /> {/* Column 2 */}
          <Skeleton className="h-4 w-1/6" /> {/* Column 3 */}
          <Skeleton className="h-4 w-1/6" /> {/* Column 4 */}
          <Skeleton className="h-4 w-1/6" /> {/* Column 5 */}
        </div>

        {/* Table Rows Skeleton */}
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-4 w-1/6" /> {/* Row 1 */}
            <Skeleton className="h-4 w-1/6" /> {/* Row 2 */}
            <Skeleton className="h-4 w-1/6" /> {/* Row 3 */}
            <Skeleton className="h-4 w-1/6" /> {/* Row 4 */}
            <Skeleton className="h-4 w-1/6" /> {/* Row 5 */}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[100vh]">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex justify-center items-center h-[100vh]">
        <p>No invoice found.</p>
      </div>
    );
  }

  const ProductTable: React.FC<{ products: ProductDetail[] }> = ({
    products,
  }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold">Product Name</TableHead>
          <TableHead className="font-bold">Quantity</TableHead>
          <TableHead className="font-bold">Price</TableHead>
          <TableHead className="font-bold">Line Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product, index) => (
          <TableRow key={index}>
            <TableCell>{product.productName}</TableCell>
            <TableCell>{product.quantity}</TableCell>
            <TableCell>Rs {product.sellPrice}</TableCell>
            <TableCell>Rs {product.quantity * product.sellPrice}</TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell colSpan={2}></TableCell>
          <TableCell className="font-bold">Grand Total</TableCell>
          <TableCell className="font-bold">Rs {invoice.grandTotal}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-4">Invoice Details</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice ID</TableHead>
            <TableHead>Invoice Date</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Customer Type</TableHead>
            <TableHead>Previous Balance</TableHead>
            {invoice.dueDate !== undefined && <TableHead>Due Date</TableHead>}

            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{invoice._id}</TableCell>
            <TableCell>
              {new Date(invoice.invoiceDate).toLocaleDateString()}
            </TableCell>
            <TableCell>{invoice.customer.customerName}</TableCell>
            <TableCell>{invoice.customer.type}</TableCell>

            <TableCell>Rs {invoice.prevBalance}</TableCell>
            <TableCell>
              {new Date(invoice?.dueDate).toLocaleDateString()}
            </TableCell>
            <TableCell>{invoice?.anyMessage || "N/A"}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <h2 className="text-xl font-semibold mb-2">Product Details</h2>

      {invoice.productDetail && invoice.productDetail.length > 0 ? (
        <ProductTable products={invoice.productDetail} />
      ) : (
        <p className="mt-2">No products in this invoice.</p>
      )}

      <Button variant="outline" className="mt-6" onClick={() => router.back()}>
        Back
      </Button>
    </div>
  );
};

export default InvoiceDetail;
