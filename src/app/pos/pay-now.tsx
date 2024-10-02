"use client";
import { Button } from "@/components/ui/button";
import Calendar from "@/components/custom-components/Calender";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  clearChart,
  Products,
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";
import { ShoppingCart } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { customer } from "@/types/customer";

const PayNowChart: React.FC<{
  grandTotal: number;
  discount: number;
  productList: Products[];
  disInPercentage: number;
  selectedCustomer?: customer;
  handleReset: () => void;
}> = ({
  grandTotal,
  discount,
  productList,
  disInPercentage,
  selectedCustomer,
  handleReset,
}) => {
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [payingAmount, setPayingAmount] = useState<number>(grandTotal);
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const [customerNotes, setCustomerNotes] = useState("");
  const returnChange = Math.max(receiveAmount - grandTotal, 0);

  const dispatch = useAppDispatch();
  const chartList: Products[] = useTypedSelector(
    (state) => state.chart.chartList
  );

  useEffect(() => {
    setPayingAmount(grandTotal);
  }, [grandTotal]);

  const componentRef = useRef<HTMLDivElement>(null);

  const handleInvoiceGenerate = async () => {
    const invoiceDetail = {
      customer: selectedCustomer,
      productDetail: chartList,
      grandTotal,
      anyMessage: customerNotes,
      ...(dueDate && { dueDate }),
    };
    try {
      const response = await fetch("/api/invoice/", {
        method: "POST",
        body: JSON.stringify(invoiceDetail),
      });
      if (response.ok) {
        dispatch(clearChart());
        setDueDate(null);
      }
    } catch (error) {
      console.error("Server Error", error);
    }
  };

  const handleProductQty = async () => {
    try {
      const response = await fetch("/api/product/edit", {
        method: "PUT",
        body: JSON.stringify(chartList),
      });
      if (response.ok) {
        dispatch(clearChart());
      }
    } catch (error) {
      console.error("Server Error", error);
    }
  };
  //1. Client Side Printing .............
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Receipt",
    pageStyle: `
      @page {
        size: 80mm auto; /* Set width to 80mm and allow dynamic height */
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: monospace;
        width: 80mm; /* Fixed width for the thermal printer */
      }
      h2, p, table {
        margin: 0;
        padding: 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
      }
      table th, table td {
        border-bottom: 1px solid black;
        padding: 2px;
      }
    `,
    onAfterPrint: () => {
      handleProductQty();
      handleInvoiceGenerate();
      handleReset();
    },
  });

  // Keep For Future
  // Server Side Printing............
  // const handlePrint = async () => {
  //   const receiptData = {
  //     grandTotal,
  //     products: productList.map((product) => ({
  //       name: product.productName,
  //       quantity: product.quantity,
  //       price: product.sellPrice,
  //     })),
  //   };

  //   try {
  //     const response = await fetch('/api/printReceipt', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ receiptData }),
  //     });

  //     if (response.ok) {
  //       console.log('Receipt printed successfully');
  //     } else {
  //       console.error('Failed to print receipt');
  //     }
  //   } catch (error) {
  //     console.error('Error printing receipt:', error);
  //   }
  // };

  const handleNoReceipt = () => {
    handleReset();
    handleProductQty();
    handleInvoiceGenerate();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-green-500 hover:bg-green-600 disabled:cursor-not-allowed"
          disabled={grandTotal === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-4" />
          Pay Now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Now</DialogTitle>
          <DialogDescription>Clear payment here</DialogDescription>
        </DialogHeader>
        <div className="flex justify-between gap-8">
          <div className="grid w-full max-w-sm items-center gap-4">
            <Label htmlFor="receive-Money">Receive Money</Label>
            <Input
              type="number"
              id="receive-Money"
              placeholder="Receive Money"
              value={receiveAmount}
              onChange={(e) => setReceiveAmount(parseInt(e.target.value, 10))}
            />
            <Label htmlFor="paying-amount">Paying Amount</Label>
            <Input
              type="number"
              id="paying-amount"
              value={payingAmount}
              onChange={(e) => setPayingAmount(parseInt(e.target.value, 10))}
              placeholder="Paying Amount"
            />
            <Label htmlFor="change-return">Change Return</Label>
            <p id="change-return" className="ml-4 font-semibold">
              {returnChange > 0 ? returnChange : 0}
            </p>
            <Label htmlFor="note">Your Message</Label>
            <Textarea
              placeholder="Type your note here."
              id="note"
              onChange={(e) => setCustomerNotes(e.target.value)}
            />
          </div>
          <div>
            <Card className="shadow-2 w-full">
              <CardContent className="capitalize flex justify-between items-center">
                <Table>
                  <TableRow>
                    <p className="p-4 font-bold text-md whitespace-nowrap">
                      Total Products: {productList.length}
                    </p>
                  </TableRow>
                  <TableRow>
                    <p className="p-4 font-semibold">
                      Discount: Rs {discount} ({disInPercentage}%)
                    </p>
                  </TableRow>
                  <TableRow>
                    <p className="p-4 font-bold whitespace-nowrap">
                      Grand Total: Rs {grandTotal}
                    </p>
                  </TableRow>
                </Table>
              </CardContent>
            </Card>
            {selectedCustomer?.type === "special-sitching" && (
              <div>
                <Label htmlFor="calendar">Due Date for Special Stitching</Label>
                <Calendar date={dueDate} handleDateChange={setDueDate} />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <div className="flex justify-between items-center w-full">
            <DialogClose>
              <Button onClick={handleNoReceipt} className="capitalize">
                No Receipt
              </Button>
            </DialogClose>
            <DialogClose>
              <Button onClick={handlePrint}>Print Receipt</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Receipt content for printing */}

      <div 
      style={{ display: "none" }}
      >
        <div ref={componentRef}>
          <div
            style={{
              width: "78mm",
              fontFamily: "monospace",
              padding:"10px"
            }}
          >
            {/* Header */}
            <h2
              style={{
                textAlign: "center",
                margin: "5px 0",
                fontSize: "22px",
                fontFamily: "fantasy",
                fontWeight: "bold",
                borderBottom: "2px solid black",
                paddingBottom: "5px",
              }}
            >
              Siddique Uniform Centre
            </h2>
            <p style={{ textAlign: "center", margin: "2px 0" }}>
              Saran Market Karianwala
            </p>
            <p style={{ textAlign: "center", margin: "2px 0" }}>
              Phone: 03086139401
            </p>

            {/* Receipt Information */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                border: "1px solid black",
                padding: "5px",
                margin: "10px 0",
                borderRadius: "3px",
              }}
            >
              <p style={{ margin: "0", fontWeight: "bold" }}>Receipt No:</p>
              <p style={{ margin: "0" }}>
                Date: {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Customer Info */}
            <p
              style={{
                textAlign: "left",
                textTransform: "capitalize",
                margin: "5px 0",
              }}
            >
              <strong>Customer Name:</strong> {selectedCustomer?.customerName}
            </p>
            <p
              style={{
                textAlign: "left",
                textTransform: "capitalize",
                margin: "5px 0",
              }}
            >
              <strong>Customer Type:</strong> {selectedCustomer?.type}
            </p>

            {/* Product Table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "10px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid black",
                      paddingBottom: "5px",
                    }}
                  >
                    Product
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      borderBottom: "1px solid black",
                      paddingBottom: "5px",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      borderBottom: "1px solid black",
                      paddingBottom: "5px",
                    }}
                  >
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {productList.map((product) => (
                  <tr key={product.productName}>
                    <td style={{ padding: "5px 0" }}>{product.productName}</td>
                    <td style={{ textAlign: "center", padding: "5px 0" }}>
                      {product.quantity}
                    </td>
                    <td style={{ textAlign: "right", padding: "5px 0" }}>
                      Rs {product.sellPrice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Discounts and Totals */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderTop: "1px solid black",
              }}
            >
              <span>
                <strong>Discount:</strong>
              </span>
              <span>
                Rs {discount} ({disInPercentage}%)
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderTop: "1px solid black",
                fontWeight: "bold",
              }}
            >
              <span>Grand Total:</span>
              <span>Rs {grandTotal}</span>
            </div>

            {/* Footer */}
            <p
              style={{
                textAlign: "center",
                margin: "10px 0 0",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Thank you for shopping with us!
            </p>
            <p
              style={{
                textAlign: "center",
                margin: "0",
                fontSize: "12px",
                fontStyle: "italic",
              }}
            >
              Visit again!
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default PayNowChart;
