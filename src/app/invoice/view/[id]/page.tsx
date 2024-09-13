"use client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ProductDetail = {
  _id: string;
  productName: string;
  quantity: number;
  sellPrice: number;
};

interface Invoice {
  _id: string;
  invoiceDate: string;
  customer: string;
  grandTotal: number;
  prevBalance: number;
  anyMessage: string;
  productDetail: ProductDetail[];
}

const InvoiceDetail: React.FC = () => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const router = useRouter();
  const { id } = router.query; // Get invoice ID from URL

  // Fetch the invoice by ID
  const getInvoiceById = async (invoiceId: string) => {
    const res = await fetch(`/api/invoice/${invoiceId}`);
    const data = await res.json();
    if (data) {
      setInvoice(data);
    }
  };

  useEffect(() => {
    if (id) {
      getInvoiceById(id as string);
    }
  }, [id]);

  if (!invoice) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container p-6">
      <h1 className="text-xl font-bold">Invoice Details</h1>

      <div className="mt-4">
        <p><strong>Invoice ID:</strong> {invoice._id}</p>
        <p><strong>Invoice Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
        <p><strong>Customer:</strong> {invoice.customer}</p>
        <p><strong>Grand Total:</strong> ${invoice.grandTotal}</p>
        <p><strong>Previous Balance:</strong> ${invoice.prevBalance}</p>
        <p><strong>Message:</strong> {invoice.anyMessage || "N/A"}</p>

        <h2 className="mt-4 text-lg font-semibold">Product Details</h2>
        {invoice.productDetail.length > 0 ? (
          <ul className="list-disc ml-6">
            {invoice.productDetail.map((product) => (
              <li key={product._id}>
                {product.productName} - {product.quantity} x ${product.sellPrice}
              </li>
            ))}
          </ul>
        ) : (
          <p>No products in this invoice.</p>
        )}
      </div>

      <Button variant="outline" className="mt-4" onClick={() => router.back()}>
        Back
      </Button>
    </div>
  );
};

export default InvoiceDetail;
