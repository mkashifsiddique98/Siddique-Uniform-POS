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
import ReceiptTemplate from "./receipt-template";

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
  const [customerdetail, setCustomerDetail] = useState(selectedCustomer);
  const returnChange = Math.max(receiveAmount - grandTotal, 0);

  const dispatch = useAppDispatch();
  const chartList: Products[] = useTypedSelector(
    (state) => state.chart.chartList
  );

  useEffect(() => {
    setPayingAmount(grandTotal);
  }, [grandTotal]);

  const componentRef = useRef<HTMLDivElement>(null);
  const updateCustomerBalance = async () => {
    try {
      const response = await fetch(`/api/customer/edit_prev_balance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerdetail),
      });
      if (!response.ok) {
        console.log("Failed to update customer balance");
      }
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };
  const handleInvoiceGenerate = async () => {
    const invoiceDetail = {
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
        // Reset All feild
        dispatch(clearChart());
        setDueDate(null);
        setReceiveAmount(0);
        setCustomerNotes("");
        setPayingAmount(0);
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
  const handleNoReceipt = () => {
    handleReset();
    handleProductQty();
    handleInvoiceGenerate();
    if (customerdetail?.prevBalance !== 0) {
      updateCustomerBalance();
    } // balance update}
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
      // perform all functionality
      handleNoReceipt();
    },
  });

  // Pending Balcne *************************

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
            <div className="m-2 p-2">
              <p className="text-sm">
                <strong>Remaining Balance :</strong>{" "}
                {isNaN(payingAmount - receiveAmount)
                  ? 0
                  : payingAmount - receiveAmount}
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

      <div 
      style={{ display: "none" }}
      >
        <div ref={componentRef}>
          <ReceiptTemplate
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
