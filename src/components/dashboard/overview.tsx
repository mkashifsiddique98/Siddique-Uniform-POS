"use client"

import { Invoice } from "@/types/invoice";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"


interface InvoiceListProps {
  name : string;
  total:  number

}

export function Overview({InvoiceData}:{InvoiceData:Invoice[]}) {
  const [invoiceList, setInvoiceList] = useState<InvoiceListProps[]>([])
  const processInvoiceData = (invoices: Invoice[]) => {
    // Object to hold totals by month
    const monthTotals: Record<string, number> = {};
  
    invoices.forEach((invoice) => {
      const date = new Date(invoice.invoiceDate);
      const monthName = date.toLocaleString("default", { month: "short" }); // "Jan", "Feb", etc.
  
      // Initialize month total if it doesn't exist
      if (!monthTotals[monthName]) {
        monthTotals[monthName] = 0;
      }
  
      // Add the grandTotal to the respective month
      monthTotals[monthName] += invoice.grandTotal;
    });
  
    // Convert the object into an array of { name, total } format
    const result = Object.keys(monthTotals).map((month) => ({
      name: month,
      total: monthTotals[month],
    }));
  
    return result;
  };
 
  useEffect(() => {
   const formattedData = processInvoiceData(InvoiceData);
    setInvoiceList(formattedData)
  }, [InvoiceData]);
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={invoiceList}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `Rs${value}`}
        />
        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
