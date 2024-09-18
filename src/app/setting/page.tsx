"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Encoder } from "esc-pos-encoder";

const TestPrinter: React.FC = () => {
  const [status, setStatus] = useState<string>("");

  const handlePrintTest = async () => {
    setStatus("Connecting to printer...");

    try {
      // Create a new ESC/POS encoder instance
      const encoder = new Encoder();
      
      // Add some text to the encoder
      encoder.text("Test Print\n");
      encoder.text("Printer is working!\n");
      encoder.cut(); // Add a cut command to end the print job
      
      const data = encoder.encode(); // Get the encoded data

      // Simulate sending data to the printer
      // Replace this with your actual printing logic
      await sendToPrinter(data);

      setStatus("Print successful!");
    } catch (error) {
      console.error("Error printing:", error);
      setStatus("Error printing. Check your printer connection.");
    }
  };

  const sendToPrinter = async (data: Uint8Array) => {
    // Simulate sending data to the printer
    // Replace this with your actual printer connection and sending logic
    console.log("Sending data to printer:", data);
    return new Promise<void>((resolve) => setTimeout(resolve, 1000)); // Simulate async operation
  };

  return (
    <div>
      <Button onClick={handlePrintTest}>Test Printer</Button>
      <p>Status: {status}</p>
    </div>
  );
};

export default TestPrinter;
