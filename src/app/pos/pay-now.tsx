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

import {
  Br,
  Cut,
  Line,
  Printer,
  render,
  Row,
  Text,
} from "react-thermal-printer";
import { customer } from "@/types/customer";

const PayNowChart: React.FC<{
  grandTotal: number;
  discount: number;
  productList: Products[];
  disInPercentage: number;
  selectedCustomer?: customer;
  handleReset: ()=>void
}> = ({
  grandTotal,
  discount,
  productList,
  disInPercentage,
  selectedCustomer,
  handleReset
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [payingAmount, setPayingAmount] = useState<number>(0);
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const [customerNotes, setCustomerNotes] = useState("");
  let returnChange = receiveAmount - grandTotal;
  useEffect(() => {
    setPayingAmount(grandTotal);
  }, [grandTotal]);
  const handeDateChange = (date: Date) => {
    setDate(date);
  };
  // handle Inocie Genr in database
  const handleInvoiceGenerate = async () => {
    const invoiceDetail = {
      customer: selectedCustomer?._id,
      productDetail: chartList,
      prevBalance: 0,
      grandTotal:grandTotal,
      anyMessage: customerNotes,
    };
    try {
      const response = await fetch("/api/invoice/", {
        method: "POST",
        body: JSON.stringify(invoiceDetail),
      });
      if (response.ok) {
        dispatch(clearChart());
        grandTotal = 0
      }
    } catch (error) {
      console.log("Server Error", error);
    }
  };
  // Handle Qty after saler done
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
      console.log("Server Error", error);
    }
  };
  // ======================================== Imp
  const receipt = (
    <Printer
      type="epson"
      width={42}
      characterSet="korea"
      className="flex flex-wrap"
    >
      <Text size={{ width: 4, height: 4 }} bold={true}>
        Siddique Uniform Centre
      </Text>
      <Text>Saran Market Karianwala</Text>
      <Text>{new Date().toLocaleDateString()}</Text>
      <Text>Receipt #: 001</Text> {/* Assuming this is generated dynamically */}
      <Text>Cashier: Kashif</Text>{" "}
      {/* Assuming this is generated dynamically */}
      <Br />
      <Line />
      <Row left={"Product Name"} center={"Qty"} right={"Price"} />
      {productList.map((list, index) => (
        <Row
          key={index}
          left={<Text>{list.productName}</Text>}
          center={<Text>{list.quantity}</Text>}
          right={<Text>{list.sellPrice}</Text>}
        />
      ))}
      <Line />
      <Row
        left={`(-) ${disInPercentage ? disInPercentage : 0}% Discount`}
        right={`-${discount}`}
      />
      <Line />
      <Row
        left={""}
        center={"Grand Total"}
        right={<Text bold={true}>{grandTotal}</Text>}
      />
      <Br />
      <Text>Thank you for shopping with us!</Text>
      <Cut />
    </Printer>
  );

  // Define the state for the serial port and its setter function
  // SerialPort | null
  // Need To SerialPort Add Typescr search and type
  /* eslint-disable */
  const [port, setPort] = useState(null);

  // Function to handle printing
  const handlePrint = async () => {
    handleProductQty();
    handleInvoiceGenerate();
    handleReset()
    try {
      Button;
      let _port = port;
      if (_port == null) {
        _port = await navigator?.serial?.requestPort();
        await _port.open({ baudRate: 9600 });
        setPort(_port);
      }
      const writer = _port.writable?.getWriter();
      if (writer != null) {
        const data = await render(receipt);
        await writer.write(data);
        writer.releaseLock();
      }
    } catch (error) {
      console.error("Error printing:", error);
    }
  };
  const chartList: Products[] = useTypedSelector(
    (state) => state.chart.chartList
  );
  const dispatch = useAppDispatch();
  const handleNoReceipt = () =>{
    handleReset()
    handleProductQty();
    handleInvoiceGenerate();
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={"lg"}
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
              placeholder="receive Money"
              value={receiveAmount}
              onChange={(e) => setReceiveAmount(parseInt(e.target.value, 10))}
            />
            <Label htmlFor="paying-amount">Paying Amount</Label>
            <Input
              type="number"
              id="paying-amount"
              value={payingAmount}
              onChange={(e) => setPayingAmount(parseInt(e.target.value, 10))}
              placeholder="paying amount"
            />
            <Label htmlFor="change-return">Change Return</Label>
            <p id="change-return" className="ml-4 font-semibold">
              {returnChange ? (returnChange < 0 ? 0 : returnChange) : 0}
            </p>
            <Label htmlFor="note">Your Message</Label>
            <Textarea
              placeholder="Type your note here."
              id="note"
              onChange={(e) => {
                setCustomerNotes(e.target.value);
              }}
            />
          </div>
          <div>
            <Card className="shadow-2 w-full">
              <CardContent className="capitalize flex justify-between items-center">
                <Table>
                  <TableRow>
                    <p className="p-4 font-bold text-md whitespace-nowrap">
                      Total Product&nbsp;&nbsp;&nbsp;&nbsp;
                      <span className="rounded-full p-2 bg-black  text-white">
                        {productList.length}
                      </span>
                    </p>
                  </TableRow>
                  <TableRow>
                    <p className="p-4 font-semibold">
                      Discount&nbsp;&nbsp;&nbsp;
                      <span className=" p-1">Rs:{discount}</span>
                      <span className="font-bold">({disInPercentage}%)</span>
                    </p>
                  </TableRow>
                  <TableRow>
                    <p className="p-4 font-bold whitespace-nowrap">
                      Grand Total&nbsp;&nbsp;&nbsp;
                      <span className=" p-1">Rs:{grandTotal}</span>
                    </p>
                  </TableRow>
                </Table>
              </CardContent>
            </Card>
            {selectedCustomer?.type === "special-sitching" && (
              <div>
                <Label
                  htmlFor="calendar"
                  className="text-right whitespace-nowrap"
                >
                  Due Date for Special Switching
                </Label>
                <div>
                  <Calendar date={date} handleDateChange={handeDateChange} />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div
            style={{ marginTop: 24 }}
            className="flex justify-between items-center w-full"
          >
            <DialogClose>
              <Button onClick={handleNoReceipt} className="capitalize">no Receipt</Button>
            </DialogClose>
            <DialogClose>
              <Button
                // Still Need To test
                onClick={handlePrint}
              >
                Print Receipt
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayNowChart;
