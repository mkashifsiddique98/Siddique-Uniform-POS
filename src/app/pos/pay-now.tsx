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
      dueDate: dueDate,
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

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Receipt",
    pageStyle: `
      @page {
        size: 80mm auto; /* Dynamic height based on content */
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: monospace;
        width: 80mm;
      }
    `,
    onAfterPrint: () => {
      handleProductQty();
      handleInvoiceGenerate();
      handleReset();
    },
  });

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
      <div style={{ display: "none"}}>
        <div ref={componentRef}>
          <div style={{ width: "80mm", fontFamily: "monospace"  }}>
            <h2 style={{ textAlign: "center" }}>Siddique Uniform Centre</h2>
            <p style={{ textAlign: "center" }}>Saran Market Karianwala</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((product) => (
                  <tr key={product.productName}>
                    <td className="text-center">{product.productName}</td>
                    <td>{product.quantity}</td>
                    <td >{product.sellPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Discount: Rs {discount} ({disInPercentage}%)
            </p>
            <p>Grand Total: Rs {grandTotal}</p>
            <p style={{ textAlign: "center" }}>
              Thank you for shopping with us!
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default PayNowChart;
