"use client"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Invoice } from "@/types/invoice"
import { View } from "lucide-react"
import { useEffect, useState } from "react"
import { CheckCheck } from "lucide-react"
 
 
export function TableSpecialOrder({invoiceList}:{invoiceList:Invoice[]}) {
   const [specialOrderInvoice, setSpecialOrderInvoice] = useState<Invoice[]>([])
   useEffect(() => {
    const pendingInvoices = invoiceList.filter((invoice) => invoice.status === "Pending");
   console.log("pendingInvoices",pendingInvoices)
    setSpecialOrderInvoice(pendingInvoices)
}, [invoiceList])
    
   return (
      <Table>
        <TableHeader>
          <TableRow>
           <TableHead>Order Date</TableHead>
            <TableHead>Customer Name</TableHead>
           <TableHead>Due Date</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-left">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {specialOrderInvoice.map((invoice,index) => (
            <TableRow key={invoice._id}>
              <TableCell className="font-medium">{(new Date(invoice.invoiceDate).toLocaleDateString())}</TableCell>
              <TableCell className="font-medium">{invoice.customer.customerName}</TableCell>
              <TableCell>{(new Date(invoice.dueDate).toDateString())}</TableCell>
              <TableCell className="text-center">{invoice.status}</TableCell>
              <TableCell className="text-center flex gap-1"><View /><CheckCheck /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }
  