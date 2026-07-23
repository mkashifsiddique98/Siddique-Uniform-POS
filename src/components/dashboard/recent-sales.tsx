"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Invoice } from "@/types/invoice";
import Link from "next/link";
import { Button } from "../ui/button";


export function RecentSales({ InvoiceData }: { InvoiceData: Invoice[] }) {
  const [visibleCount, setVisibleCount] = useState(4);

  const loadMore = () => {
    setVisibleCount((prevCount) => prevCount + 7);
  };

  const formatCurrency = (amount?: number) =>
    amount?.toLocaleString("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) ?? "PKR 0";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {InvoiceData.slice(-visibleCount).reverse().map((invoice) => (
        <Link
          href={`/invoice/view/${invoice?._id}`}
          key={invoice?._id}
          className="block"
          aria-label={`View invoice ${invoice?._id}`}
        >
          <div className="flex items-center space-x-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage
                src={`image/customer/${invoice?.customer?.type}.png`}
                alt={invoice?.customer?.customerName || "Customer Avatar"}
              />
              <AvatarFallback>
                {invoice?.customer?.customerName
                  ? invoice.customer.customerName.slice(0, 2).toUpperCase()
                  : "NA"}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col flex-grow overflow-hidden">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {invoice?.customer?.customerName || "Unknown Customer"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {formatDate(invoice.invoiceDate)}
              </p>
            </div>

            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 font-semibold text-lg min-w-[110px] justify-end">
              {/* <DollarSign className="h-6 w-6" /> */}
              <span>{formatCurrency(invoice?.grandTotal)}</span>
            </div>
          </div>
        </Link>
      ))}

      {visibleCount < InvoiceData.length && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={loadMore}
            variant="outline"
            className="font-semibold px-6 py-2 rounded-md shadow hover:shadow-lg transition-shadow"
            aria-label="Load more recent sales"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
