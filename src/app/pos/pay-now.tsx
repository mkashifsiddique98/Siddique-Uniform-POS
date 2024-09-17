"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Row, Text, Line, Br, Cut } from "react-thermal-printer"; // You can remove this import if using Epson SDK
import { ShoppingCart } from "lucide-react";
import { clearChart, Products, useAppDispatch, useTypedSelector } from "@/lib/store";

// Ensure you import the SDK in your public folder or install it via script

const PayNowChart = ({
  grandTotal,
  discount,
  productList,
  disInPercentage,
  selectedCustomer,
  handleReset,
}) => {
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const [customerNotes, setCustomerNotes] = useState("");
  const returnChange = Math.max(receiveAmount - grandTotal, 0);

  const dispatch = useAppDispatch();
  const chartList: Products[] = useTypedSelector((state) => state.chart.chartList);

  const handleInvoiceGenerate = async () => {
    const invoiceDetail = {
      customer: selectedCustomer?._id,
      productDetail: chartList,
      grandTotal,
      anyMessage: customerNotes,
    };

    try {
      const response = await fetch("/api/invoice/", {
        method: "POST",
        body: JSON.stringify(invoiceDetail),
      });
      if (response.ok) {
        dispatch(clearChart());
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

  const handlePrint = async () => {
    handleProductQty();
    handleInvoiceGenerate();
    handleReset();
    
    // Epson ePOS SDK Code
    const ePosDevice = new window.epson.ePOSDevice();
    
    // Replace this with your printer IP
    ePosDevice.connect('192.168.x.x', ePosDevice.DEVICE_TYPE_PRINTER, (status) => {
      if (status === 'OK') {
        const printer = ePosDevice.getPrinter();
        
        // Start the receipt text
        printer.addTextAlign(printer.ALIGN_CENTER);
        printer.addTextSize(2, 2);
        printer.addText('Siddique Uniform Centre\n');
        printer.addText('Saran Market Karianwala\n');
        printer.addText(`Date: ${new Date().toLocaleDateString()}\n`);
        printer.addFeedLine(1);
        
        // Print Product List
        printer.addTextAlign(printer.ALIGN_LEFT);
        printer.addText(`Receipt #001\n`);
        productList.forEach((product) => {
          printer.addText(`${product.productName}    ${product.quantity}    ${product.sellPrice}\n`);
        });
        
        // Print Totals
        printer.addFeedLine(1);
        printer.addText(`Discount: Rs ${discount} (${disInPercentage}%)\n`);
        printer.addText(`Grand Total: Rs ${grandTotal}\n`);
        printer.addFeedLine(1);
        
        // Print Footer
        printer.addTextAlign(printer.ALIGN_CENTER);
        printer.addText('Thank you for shopping with us!\n');
        printer.addCut(printer.CUT_FEED);

        // Send the receipt to the printer
        printer.send();
      } else {
        console.error("Connection to printer failed:", status);
      }
    });
  };

  return (
    <div>
      <Button onClick={handlePrint}>Print Receipt</Button>
    </div>
  );
};

export default PayNowChart;
