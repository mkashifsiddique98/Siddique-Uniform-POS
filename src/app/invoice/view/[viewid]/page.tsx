"use client";
import { useState, useEffect } from "react";
import { Invoice, ProductDetail } from "@/types/invoice";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const InvoiceDetail: React.FC<{ params: { viewid: string } }> = ({ params }) => {
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
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600 text-lg font-semibold">{error}</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">No invoice found.</p>
      </div>
    );
  }

  // Improved Product Table component with grouped headings
  const ProductTable: React.FC<{ products: ProductDetail[] }> = ({ products }) => {
    const returnedProducts = products.filter((product) => product.return);
    // Calculate total amount for returned products
    const returnedProductsTotalAmount = returnedProducts.reduce((total, product) => {
      // Multiply sellPrice by quantity for each product
      return total + product.sellPrice * product.quantity;
    }, 0);
    const newProducts = products.filter((product) => !product.return);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Line Total</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returnedProducts.length > 0 && (
            <>
              <TableRow className="bg-gray-200">
                <TableCell colSpan={5} className="font-bold">
                  Returned Products
                </TableCell>
              </TableRow>
              {returnedProducts.map((product, index) => (
                <TableRow key={`returned-${index}`}>
                  <TableCell>{product.productName}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>Rs {product.sellPrice}</TableCell>
                  <TableCell>Rs {product.quantity * product.sellPrice}</TableCell>
                  <TableCell>
                    {/* Place action buttons here if needed */}
                  </TableCell>

                </TableRow>

              ))}
              <TableCell colSpan={3} className="text-right font-semibold">
                Return Sub-total
              </TableCell>
              <TableCell className="font-semibold">-Rs {returnedProductsTotalAmount}</TableCell>
            </>

          )}
          {newProducts.length > 0 && (
            <>
              {returnedProducts.length > 0 &&
                <TableRow className="bg-gray-200">
                  <TableCell colSpan={5} className="font-bold">
                    New Products
                  </TableCell>
                </TableRow>}
              {newProducts.map((product, index) => (
                <TableRow key={`new-${index}`}>
                  <TableCell>{product.productName}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>Rs {product.sellPrice}</TableCell>
                  <TableCell>Rs {product.quantity * product.sellPrice}</TableCell>
                  <TableCell>
                    {/* Place action buttons here if needed */}
                  </TableCell>
                </TableRow>
              ))}
            </>
          )}

          <TableRow>
            <TableCell colSpan={3} className="text-right font-bold">
              Grand Total
            </TableCell>
            <TableCell className="font-bold">Rs {invoice.grandTotal}</TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Invoice Details</h1>

      {/* Invoice Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 border rounded shadow-sm">
          <span className="font-semibold">Invoice ID:</span> {invoice._id}
        </div>
        <div className="p-4 border rounded shadow-sm">
          <span className="font-semibold">Invoice Date:</span>{" "}
          {new Date(invoice.invoiceDate).toLocaleDateString()}
        </div>
        <div className="p-4 border rounded shadow-sm">
          <span className="font-semibold">Customer Name:</span>{" "}
          {invoice.customer.customerName}
        </div>
        <div className="p-4 border rounded shadow-sm">
          <span className="font-semibold">Customer Type:</span>{" "}
          {invoice.customer.type}
        </div>
        <div className="p-4 border rounded shadow-sm">
          <span className="font-semibold">Previous Balance:</span> Rs{" "}
          {invoice.prevBalance}
        </div>
        {invoice.dueDate && (
          <div className="p-4 border rounded shadow-sm">
            <span className="font-semibold">Due Date:</span>{" "}
            {new Date(invoice.dueDate).toLocaleDateString()}
          </div>
        )}
        <div className="p-4 border rounded shadow-sm md:col-span-2">
          <span className="font-semibold">Message:</span>{" "}
          {invoice.anyMessage || "N/A"}
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Product Details</h2>
      {invoice.productDetail && invoice.productDetail.length > 0 ? (
        <ProductTable products={invoice.productDetail} />
      ) : (
        <p className="text-gray-600 mt-4">No products in this invoice.</p>
      )}

      <div className="mt-8">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default InvoiceDetail;
