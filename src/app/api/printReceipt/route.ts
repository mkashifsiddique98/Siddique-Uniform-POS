import { NextRequest, NextResponse } from 'next/server';
import escpos from 'escpos';

// Import the USB adapter for the printer
escpos.USB = require('escpos-usb');

// Define the receipt data type
type ReceiptData = {
  products: { name: string; quantity: number; price: number }[];
  grandTotal: number;
};

export async function POST(request: NextRequest) {
  try {
    // const { receiptData} =await request.json();

    // // Create a connection to the printer via USB
    // const device = new escpos.USB();
    // const printer = new escpos.Printer(device);

    // // Open the printer connection
    // device.open(() => {
    //   printer
    //     .font('a')
    //     .align('ct')
    //     .style('b')
    //     .size(1, 1)
    //     .text('Siddique Uniform Centre')
    //     .text('Saran Market Karianwala')
    //     .text(`Date: ${new Date().toLocaleDateString()}`)
    //     .text('---------------------------')
    //     .align('lt')
    //     .tableCustom([
    //       { text: 'Product', align: 'LEFT', width: 0.5 },
    //       { text: 'Qty', align: 'CENTER', width: 0.2 },
    //       { text: 'Price', align: 'RIGHT', width: 0.3 }
    //     ]);

    //   // Print each product
    //   receiptData.products.forEach((product) => {
    //     printer.tableCustom([
    //       { text: product.name, align: 'LEFT', width: 0.5 },
    //       { text: product.quantity.toString(), align: 'CENTER', width: 0.2 },
    //       { text: `Rs ${product.price}`, align: 'RIGHT', width: 0.3 }
    //     ]);
    //   });

    //   printer
    //     .text('---------------------------')
    //     .text(`Grand Total: Rs ${receiptData.grandTotal}`)
    //     .cut()
    //     .close();
    const escpos = require('escpos');
    escpos.Network = require('escpos-network');
    
    const device = new escpos.Network('192.134.1.1');  // Replace with the IP address of your printer
    const printer = new escpos.Printer(device);
    
    device.open(() => {
      printer
        .text('Hello World')
        .cut()
        .close();
    });
    
        return Response.json({ message: 'Receipt printed successfully' });
    // });
  } catch (error) {
    console.error('Error printing receipt:', error);
    return Response.json({ error: 'Error printing receipt' });
  }
} 

