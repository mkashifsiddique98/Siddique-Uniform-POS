"use client"
import { useState, useEffect } from "react";
import { Invoice, ProductDetail } from "@/types/invoice";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Import the Button
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"; // Example Table component import

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
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
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
          <TableHead>Product Name</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Line Total</TableHead>
          <TableHead>Action</TableHead>
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
            {invoice.dueDate !== undefined && (
              <TableCell>
                {new Date(invoice?.dueDate).toLocaleDateString()}
              </TableCell>
            )}
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