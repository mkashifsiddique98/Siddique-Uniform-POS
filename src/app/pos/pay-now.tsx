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
  const [partialMoneyPay, setPartialMoneyPay] = useState<boolean>(false)
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
    const remainingBalance = partialMoneyPay ? (payingAmount - receiveAmount) : 0;
    // Mark product as Sold
    const updateCharList = chartList.map((item: any) => ({
      ...item,
      sold: true,
    }));
    const invoiceDetail = {
      invoiceNo,
      discount,
      customer: customerdetail ? customerdetail : selectedCustomer,
      productDetail: updateCharList,
      grandTotal,
      prevBalance: remainingBalance,
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

        const storedValue = Number(localStorage.getItem('invoiceNo'));

        // Check if storedValue is a valid number, otherwise set it to 0
        const validStoredValue = isNaN(storedValue) ? 0 : storedValue;

        // Generate new invoice number asynchronously
        const invoiceNewNumber = await handleGenerateNewInvoiceNumber();

        // Ensure that invoiceNewNumber is a valid number
        const validInvoiceNewNumber = isNaN(invoiceNewNumber) ? 0 : invoiceNewNumber;

        // Decide which number to use (stored or generated)
        const newInvoiceNumber = Math.max(validStoredValue, validInvoiceNewNumber);

        // Update localStorage with the new number
        localStorage.setItem('invoiceNo', String(newInvoiceNumber + 1));

        // Dispatch the new invoice number to the store
        dispatch(setInvoiceNumber(newInvoiceNumber + 1));

        console.log("New invoice number:", newInvoiceNumber + 1);

      }
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  };

  // Problem : if someone just return and 
  // second time you return it only show run to minus the
  // product qty , how can deal in this situtation
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
            <Label htmlFor="partial-Money">Partial Money paying</Label>
            <Input
              type="checkbox"
              id="partial-Money"
              className="cursor-pointer"
              onChange={(e) => setPartialMoneyPay(!partialMoneyPay)}
            />
            <Label htmlFor="receive-Money">Receive Money</Label>
            <Input
              type="number"
              id="receive-Money"
              placeholder="Receive Money"
              min={0}
              value={receiveAmount}
              onChange={(e) => setReceiveAmount(parseInt(e.target.value, 10))}
            />

            <Label htmlFor="paying-amount">Paying Amount</Label>
            <Input
              type="number"
              id="paying-amount"
              min={0}
              value={payingAmount}
              onChange={(e) => setPayingAmount(parseInt(e.target.value, 10))}
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
            <Card className="shadow-xl w-full hover:border-black border-2 cursor-pointer">
              <CardContent className="capitalize flex justify-between items-center">
                <Table>
                  <TableRow>
                    <p className="p-4 font-bold text-md whitespace-nowrap">
                      Total Products: {productList.length} pcs
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
            {partialMoneyPay && <div className="m-2 p-2">
              <p className="text-sm">
                <strong>Remaining Balance :</strong> {payingAmount - receiveAmount}
              </p>
            </div>}


            {selectedCustomer?.type === "special-sitching" && (
              <div>
                <Label htmlFor="calendar" className="py-2">Due Date for Special Stitching</Label>
                <Calendar
                  date={dueDate} handleDateChange={setDueDate}
                />

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
        style={{ display: "none" , position: "absolute", top: 1 ,right:1, backgroundColor: "white" 
        }}
      >
        <div ref={componentRef}>
          <ReceiptTemplate
            invoiceNo={invoiceNo}
            remainingBalance={partialMoneyPay ? (payingAmount - receiveAmount) : 0}
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
