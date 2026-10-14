"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import Calendar from "@/components/custom-components/Calender";
import { Printer, ShoppingCart } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import {
  clearChart,
  Products,
  setInvoiceNumber,
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";
import ReceiptTemplate from "./receipt-template";
import { customer } from "@/types/customer";
import { useToast } from "@/components/ui/use-toast";
import { useStockSync } from "./useStockSync";
import { stockRefreshGate } from "@/lib/stockRefresh";

interface PayNowChartProps {
  grandTotal: number;
  discount: number;
  productList: Products[];
  disInPercentage: number;
  selectedCustomer?: customer;
  handleReset: () => void;
  editInvoice: boolean;
}

const PayNowChart: React.FC<PayNowChartProps> = ({
  grandTotal,
  discount,
  productList,
  disInPercentage,
  selectedCustomer,
  handleReset,
  editInvoice,

}) => {
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [payingAmount, setPayingAmount] = useState<number>(grandTotal);
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const [customerNotes, setCustomerNotes] = useState("");
  const [customerdetail, setCustomerDetail] = useState(selectedCustomer);
  // RePrint State
  const [isRePrint, setRePrint] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { refreshStock } = useStockSync();
  const invoiceNo = useTypedSelector((state) => state.invoice.invoiceNumber);
  const chartList = useTypedSelector((state) => state.chart.chartList);
  const returnChange = Math.max(receiveAmount - grandTotal, 0);
  const [partialMoneyPay, setPartialMoneyPay] = useState<boolean>(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  // One UUID per save attempt: reused on retry, discarded after success or when the cart changes
  const attemptKeyRef = useRef<string | null>(null);
  const lastSavedCartRef = useRef<Products[] | null>(null);
  useEffect(() => {
    attemptKeyRef.current = null;
  }, [chartList]);
  // Model
  const [isOpen, setIsOpen] = useState(false);
  // ==================== Receipt Template ================
  const [formData, setFormData] = useState({
    shopName: "",
    shopTagline: "",
    shopAddress: "",
    shopPhone: "",
    messageCustomer: "",
    socialMedia: {
      facebook: "",
      tiktok: "",
    },
  });
  const mode = useTypedSelector((state) => state.mode); // "retail" | "wholesale"
  // --------      ---- --------------------
  const modelManage = () => {
    setIsOpen(!isOpen);
  };
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
  const handleInvoiceGenerate = async (): Promise<boolean> => {
    // A stale print callback must never re-save a cart that was already saved
    if (lastSavedCartRef.current === chartList || chartList.length === 0) {
      return false;
    }
    if (!attemptKeyRef.current) {
      attemptKeyRef.current = crypto.randomUUID();
    }
    const idempotencyKey = attemptKeyRef.current;
    const remainingBalance = partialMoneyPay ? payingAmount - receiveAmount : 0;
    // Returns are saved as "return" lines; the server applies all stock changes in this one call
    const updateCharList = chartList.map((item: any) => {
      const isReturn = item.mode === "return";
      return {
        ...item,
        mode: isReturn ? "return" : "sale",
        return: isReturn,
        sold: !isReturn,
      };
    });
    const invoiceDetail = {
      // The server numbers new invoices; the number is only sent when editing
      ...(editInvoice && { invoiceNo, isEdit: true }),
      idempotencyKey,
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceDetail),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        toast({
          variant: "destructive",
          title: "Invoice not saved",
          description: result?.error || "Failed to save invoice.",
        });
        // 409: stock changed or a return was rejected, so show the cashier the real numbers
        if (response.status === 409) refreshStock();
        return false;
      }

      const result = await response.json().catch(() => null);
      lastSavedCartRef.current = chartList;
      attemptKeyRef.current = null;
      refreshStock();
      {
        dispatch(clearChart());
        setDueDate(null);
        setReceiveAmount(0);
        setCustomerNotes("");
        setPayingAmount(0);

        // The next number comes from the server response, not localStorage or another counter call
        const nextNo = Number(result?.nextInvoiceNo);
        dispatch(setInvoiceNumber(nextNo > 0 ? nextNo : Number(result?.invoiceNo || invoiceNo) + 1));
      }
      return true;
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({
        variant: "destructive",
        title: "Invoice not saved",
        description: "Could not reach the server.",
      });
      return false;
    }
  };

  // Stock is no longer updated from the UI: POST /api/invoice saves the invoice
  // and applies all stock changes (sales and returns) in one transaction.
  const handleNoReceipt = async () => {
    // Ref-based flag: state would not update in time to block a fast double click
    if (savingRef.current) return;
    savingRef.current = true;
    stockRefreshGate.beginSave();
    setIsSaving(true);
    try {
      const saved = await handleInvoiceGenerate();
      if (!saved) return;

      handleReset();
      dispatch(clearChart());
    } catch (error) {
      console.error("Error in handling no receipt:", error);
    } finally {
      savingRef.current = false;
      stockRefreshGate.endSave();
      setIsSaving(false);
    }
  };
  // ---------- For Web Printing -------------
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Receipt",
    onAfterPrint: handleNoReceipt,
  });
  // --------------- For Window Printing ---------
  //  const handlePrint = () => {
  //   if (!componentRef.current) return;

  //   // Get the HTML content you want to print
  //   const contentHTML = componentRef.current.innerHTML;

  //   // Send to main process to print silently
  //   ipcRenderer.send('print-silent', contentHTML);
  // };
  // ---Handle Re-Print Functionality ---
  const rePrintFunctionality = () => {
    setRePrint(true);
  };
  useEffect(() => {
    if (isRePrint) {
      handlePrint();
      setRePrint(false);
    }
  }, [isRePrint]);
  // ======================== Template From Backend ==================

  useEffect(() => {
    // Fetch existing data to populate the form for editing
    const fetchData = async () => {
      try {
        const response = await fetch("/api/setting/receipt-template");
        const res = await response.json();
        if (res.success && res.data.length > 0) {
          setFormData(res.data[0]);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };

    fetchData();
  }, []);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/*  Dont Render  */}
      <DialogTrigger asChild>
        <>
          {/* For Re-Print Receipt  */}
          {editInvoice && (
            <Button
              title="Please only use to Print Re-Receipt"
              variant="secondary"
              className={`btn border-black font-bold disabled:cursor-not-allowed`}
              disabled={productList.length === 0 || !editInvoice}
              onClick={rePrintFunctionality}
            >
              <Printer className="w-4 h-4 mr-4" />
              Re-Print Recipt
            </Button>
          )}
          {/* Perform direct */}
          <Button
            className="bg-green-500 hover:bg-green-600 disabled:cursor-not-allowed"
            disabled={grandTotal === 0 || productList.length === 0}
            onClick={modelManage}
          >
            <ShoppingCart className="w-4 h-4 mr-4" aria-hidden="true" />
            Pay Now
          </Button>
        </>
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
                    <p className="p-4 font-semibold">
                      Discount: Rs {discount} and {disInPercentage + "%"}
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
            {partialMoneyPay && (
              <div className="m-2 p-2">
                <p className="text-sm">
                  <strong>Remaining Balance :</strong>{" "}
                  {payingAmount - receiveAmount}
                </p>
              </div>
            )}

            {selectedCustomer?.type === "special-sitching" && (
              <div>
                <Label htmlFor="calendar" className="py-2">
                  Due Date for Special Stitching
                </Label>
                <Calendar date={dueDate} handleDateChange={setDueDate} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between items-center w-full">
            <DialogClose>
              <Button onClick={handleNoReceipt} disabled={isSaving} className="capitalize">
                No Receipt
              </Button>
            </DialogClose>
            <DialogClose>
              <Button onClick={handlePrint} disabled={isSaving}>Print Receipt</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Receipt content for printing */}
      <div
        style={{
          display: "none",
          position: "absolute",
          top: 1,
          right: 1,
          backgroundColor: "white",
        }}
      >
        <div ref={componentRef}>
          <ReceiptTemplate
            invoiceNo={invoiceNo}
            remainingBalance={
              partialMoneyPay ? payingAmount - receiveAmount : 0
            }
            disInPercentage={disInPercentage}
            discount={discount}
            grandTotal={grandTotal}
            productList={productList}
            selectedCustomer={selectedCustomer}
            dueDate={dueDate}
            isRePrint={isRePrint}
            // Receipt Template
            mode={mode}
            shopName={formData.shopName}
            shopTagline={formData.shopTagline}
            shopAddress={formData.shopAddress}
            messageCustomer={formData.messageCustomer}
            shopPhone={formData.shopPhone}
            socialMedia={formData.socialMedia}
           

          />
        </div>
      </div>
    </Dialog>
  );
};

export default PayNowChart;
