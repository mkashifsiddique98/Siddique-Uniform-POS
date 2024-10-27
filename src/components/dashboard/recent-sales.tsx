"use client"
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Invoice } from "@/types/invoice";
import Link from "next/link";
import { Button } from "../ui/button";

export function RecentSales({ InvoiceData }: { InvoiceData: Invoice[] }) {
  const [visibleCount, setVisibleCount] = useState(5);

  const loadMore = () => {
    setVisibleCount((prevCount) => prevCount + 5);
  };

  return (
    <div>
      {InvoiceData.slice(-visibleCount).map((invoice) => (
        <Link href={`/invoice/view/${invoice?._id}`} key={invoice?._id}>
          <div className="space-y-8 border-b mb-1 pb-1">
            <div className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={`image/customer/${invoice?.customer?.type}.png`} alt="Avatar" />
                <AvatarFallback>{invoice?.customer?.customerName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {invoice?.customer?.customerName}
                </p>
              </div>
              <div className="ml-auto font-medium">{invoice?.grandTotal}</div>
            </div>
          </div>
        </Link>
      ))}
      {visibleCount < InvoiceData.length && (
        <Button
          onClick={loadMore}
          variant={"link"}
          className="font-semibold"
        >
          Load More
        </Button>
      )}
    </div>
  );
}
