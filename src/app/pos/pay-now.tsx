"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import Calendar from "@/components/custom-components/Calender";
import { ShoppingCart } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { clearChart, Products, setInvoiceNumber, useAppDispatch, useTypedSelector } from "@/lib/store";
import ReceiptTemplate from "./receipt-template";
import { customer } from "@/types/customer";
import { handleGenerateNewInvoiceNumber } from "./usePos";

interface PayNowChartProps {
  grandTotal: number;
  discount: number;
  productList: Products[];
  disInPercentage: number;
  selectedCustomer?: customer;
  handleReset: () => void;
}

const PayNowChart: React.FC<PayNowChartProps> = ({
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
  const [customerdetail, setCustomerDetail] = useState(selectedCustomer);

  const dispatch = useAppDispatch();
  const invoiceNo = useTypedSelector((state) => state.invoice.invoiceNumber);
  const chartList = useTypedSelector((state) => state.chart.chartList);
  const returnChange = Math.max(receiveAmount - grandTotal, 0);

  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPayingAmount(grandTotal);
  }, [grandTotal]);

  useEffect(() => {
    if (receiveAmount < payingAmount && selectedCustomer) {
      const remainingBalance = payingAmount - receiveAmount;
      const updatedCustomer = {
        ...selectedCustomer,
        prevBalance: (selectedCustomer.prevBalance || 0) + remainingBalance,
      };
      setCustomerDetail(updatedCustomer);
    }
  }, [receiveAmount]);
  const handleInvoiceGenerate = async () => {
    const invoiceDetail = {
      invoiceNo,
      discount,
      customer: customerdetail,
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
        dispatch(setInvoiceNumber(0));
        dispatch(clearChart());
        setDueDate(null);
        setReceiveAmount(0);
        setCustomerNotes("");
        setPayingAmount(0);
  
        // Get the stored invoice number from localStorage
        const storedValue = Number(localStorage.getItem('invoiceNo')) || 0;
  
        // Generate new invoice number asynchronously
        const invoiceNewNumber = await handleGenerateNewInvoiceNumber();
  
        // Decide which number to use (storedValue or invoiceNewNumber)
        const newInvoiceNumber = Math.max(storedValue, invoiceNewNumber);
  
        // Update localStorage and dispatch the new invoice number
        localStorage.setItem('invoiceNo', String(newInvoiceNumber + 1));
        dispatch(setInvoiceNumber(newInvoiceNumber + 1));
  
        console.log("New invoice number:", newInvoiceNumber + 1);
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  };
  

  const handleProductQtyUpdate = async () => {
    try {
      await fetch("/api/product/edit", {
        method: "PUT",
        body: JSON.stringify(chartList),
      });
      dispatch(clearChart());
    } catch (error) {
      console.error("Error updating product quantity:", error);
    }
  };

 const handleNoReceipt = async () => {
    try {
       handleProductQtyUpdate();
       handleInvoiceGenerate();
     
      handleReset();
    } catch (error) {
      console.error("Error in handling no receipt:", error);
    }
  };
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Receipt",
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: monospace;
        width: 80mm;
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
    onAfterPrint: handleNoReceipt,
  });

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
              onChange={(e) => setReceiveAmount(parseInt(e.target.value, 10) || 0)}
            />

            <Label htmlFor="paying-amount">Paying Amount</Label>
            <Input
              type="number"
              id="paying-amount"
              value={payingAmount}
              onChange={(e) => setPayingAmount(parseInt(e.target.value, 10) || 0)}
              placeholder="Paying Amount"
            />

            <Label htmlFor="change-return">Change Return</Label>
            <p id="change-return" className="ml-4 font-semibold">
              {returnChange}
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

            <div className="m-2 p-2">
              <p className="text-sm">
                <strong>Remaining Balance :</strong> {payingAmount - receiveAmount}
              </p>
            </div>

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
      <div style={{ display: "none" }}>
        <div ref={componentRef}>
          <ReceiptTemplate
            invoiceNo={invoiceNo}
            remainingBalance={payingAmount - receiveAmount}
            disInPercentage={disInPercentage}
            discount={discount}
            grandTotal={grandTotal}
            productList={productList}
            selectedCustomer={selectedCustomer}
            dueDate={dueDate}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default PayNowChart;
