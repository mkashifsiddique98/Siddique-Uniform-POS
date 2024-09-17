"use client";

import { useRouter } from "next/navigation";
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
      <div className="flex justify-center items-center h-[100vh]">
        <p>Loading...</p>
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

  const ProductTable: React.FC<{ products: ProductDetail[] }> = ({ products }) => (
    <table className="w-full text-left border-collapse border border-gray-300">
      <thead>
        <tr>
          <th className="border border-gray-300 p-2">Product Name</th>
          <th className="border border-gray-300 p-2">Quantity</th>
          <th className="border border-gray-300 p-2">Price</th>
          <th className="border border-gray-300 p-2">Line Total</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product._id}>
            <td className="border border-gray-300 p-2">{product.productName}</td>
            <td className="border border-gray-300 p-2">{product.quantity}</td>
            <td className="border border-gray-300 p-2">Rs {product.sellPrice}</td>
            <td className="border border-gray-300 p-2">Rs {(product.quantity * product.sellPrice).toFixed(2)}</td>
          </tr>
        ))}
        <tr>
          <td className="border border-gray-300 p-2 font-bold" colSpan={3}>
            Grand Total
          </td>
          <td className="border border-gray-300 p-2 font-bold" colSpan={1}>Rs {invoice.grandTotal}</td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-4">Invoice Details</h1>

      <table className="w-full text-left mb-6 border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Invoice ID</th>
            <th className="border border-gray-300 p-2">Invoice Date</th>
            <th className="border border-gray-300 p-2">Customer</th>
            <th className="border border-gray-300 p-2">Previous Balance</th>
            <th className="border border-gray-300 p-2">Message</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2">{invoice._id}</td>
            <td className="border border-gray-300 p-2">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
            <td className="border border-gray-300 p-2">{invoice.customer}</td>
            <td className="border border-gray-300 p-2">Rs {invoice.prevBalance}</td>
            <td className="border border-gray-300 p-2">{invoice.anyMessage || "N/A"}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mb-2">Product Details</h2>

      {invoice.productDetail.length > 0 ? (
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
