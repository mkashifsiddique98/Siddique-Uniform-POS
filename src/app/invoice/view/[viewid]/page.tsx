"use client";
import { useState, useEffect } from "react";
import { Invoice, ProductDetail } from "@/types/invoice";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isVoided, resolveReturnStatus, summarizeInvoice } from "@/lib/posHelpers";
import { toast } from "@/components/ui/use-toast";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { useStockSync } from "@/app/pos/useStockSync";
import ReturnDetailsDialog, { ReturnBadge } from "@/app/pos/ReturnDetailsDialog";
import { formatReturnTime } from "@/lib/formatTime";
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
  const isAdmin = useIsAdmin();
  const { refreshStock } = useStockSync();
  const [returnsOpen, setReturnsOpen] = useState(false);
  const { viewid } = params;

  const handleCancelReturn = async (lineIndex: number, returnIndex: number) => {
    if (!invoice) return;
    if (!window.confirm("Cancel this return? The units are taken out of stock again.")) return;
    await changeInvoice("/api/invoice/return/cancel", "POST", { id: invoice._id, lineIndex, returnIndex }, (data) => {
      if (data?.response) setInvoice(data.response);
    });
  };

  const changeInvoice = async (url: string, method: string, body: object, done: (data?: any) => void) => {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ description: data?.error || "Request failed" });
        return;
      }
      toast({ description: data.message });
      refreshStock();
      done(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = () => {
    if (!invoice) return;
    const hasLines = (invoice.productDetail || []).length > 0;
    const message = hasLines
      ? `Invoice #${invoice.invoiceNo} has items. Deleting it puts sold items back in stock and takes returned items out again. The invoice number stays reserved. Delete it?`
      : "Are you sure you want to delete this empty invoice?";
    if (!window.confirm(message)) return;
    changeInvoice("/api/invoice", "DELETE", { id: invoice._id, confirm: hasLines }, () =>
      router.push("/invoice")
    );
  };

  const handleVoid = () => {
    if (!invoice) return;
    if (!window.confirm(`Void invoice #${invoice.invoiceNo}? Its stock is restored and it stays on record as void.`)) return;
    changeInvoice("/api/invoice/void", "POST", { id: invoice._id }, () =>
      setInvoice({ ...invoice, voided: true })
    );
  };

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
    // Every number comes from the same helper as the invoice list, receipt and the saved total
    const summary = summarizeInvoice({ items: products, discount: invoice.discount || 0 });
    const { saleRows, returnRows } = summary;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Sold</TableHead>
            <TableHead>Returned</TableHead>
            <TableHead>Net Qty</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Line Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {saleRows.map((product, index) => (
            <TableRow key={`sold-${index}`}>
              <TableCell>
                {product.productName}
                <ReturnBadge count={product.returnedQty} onClick={() => setReturnsOpen(true)} />
              </TableCell>
              <TableCell>{product.soldQty}</TableCell>
              <TableCell>{product.returnedQty > 0 ? `-${product.returnedQty}` : 0}</TableCell>
              <TableCell>{product.netQty}</TableCell>
              <TableCell>Rs {product.sellPrice}</TableCell>
              <TableCell>Rs {product.soldAmount}</TableCell>
            </TableRow>
          ))}

          {returnRows.length > 0 && (
            <>
              <TableRow className="bg-gray-200">
                <TableCell colSpan={6} className="font-bold">
                  Returned items
                </TableCell>
              </TableRow>
              {returnRows.map((product, index) => (
                <TableRow key={`returned-${index}`}>
                  <TableCell>
                    {product.productName}
                    {product.returnReason ? (
                      <span className="text-xs text-gray-500"> ({product.returnReason})</span>
                    ) : null}
                    {product.mode === "return" && (
                      <span className="ml-2 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-xs font-semibold text-red-700">
                        Returned
                      </span>
                    )}
                    <span className="block text-xs text-red-600">{formatReturnTime(product.at)}</span>
                  </TableCell>
                  <TableCell />
                  <TableCell>-{product.quantity}</TableCell>
                  <TableCell />
                  <TableCell>Rs {product.sellPrice}</TableCell>
                  <TableCell>-Rs {-product.amount}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5} className="text-right font-semibold">
                  Refunded amount
                </TableCell>
                <TableCell className="font-semibold">-Rs {summary.refundedAmount}</TableCell>
              </TableRow>
            </>
          )}

          {summary.discount > 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-right font-semibold">
                Discount
              </TableCell>
              <TableCell className="font-semibold">-Rs {summary.discount}</TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell colSpan={5} className="text-right font-bold">
              Net Total
            </TableCell>
            <TableCell className="font-bold">Rs {summary.grandTotal}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Invoice Details
        {isVoided(invoice) && <Badge variant="destructive" className="ml-3">Void</Badge>}
        {!isVoided(invoice) && resolveReturnStatus(invoice) === "fully_returned" && (
          <Badge variant="destructive" className="ml-3">Fully returned</Badge>
        )}
        {!isVoided(invoice) && resolveReturnStatus(invoice) === "partially_returned" && (
          <Badge variant="outline" className="ml-3">Partially returned</Badge>
        )}
      </h1>

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

      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <span
          title={
            !isAdmin && invoice.productDetail?.length
              ? "Only an admin can delete an invoice that has items"
              : undefined
          }
        >
          <Button
            variant="destructive"
            disabled={!isAdmin && !!invoice.productDetail?.length}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </span>
        {isAdmin && !isVoided(invoice) && !!invoice.productDetail?.length && (
          <Button variant="outline" onClick={handleVoid}>
            Void
          </Button>
        )}
      </div>

      <ReturnDetailsDialog
        open={returnsOpen}
        onOpenChange={setReturnsOpen}
        lines={invoice.productDetail || []}
        onCancelReturn={isAdmin && !isVoided(invoice) ? handleCancelReturn : undefined}
      />
    </div>
  );
};

export default InvoiceDetail;
