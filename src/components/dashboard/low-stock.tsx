"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ProductFormState } from "@/types/product";
import Link from "next/link";

const LOWSTOCK = ({
  productResponse,
}: {
  productResponse: ProductFormState[];
}) => {
  const [lowStock, setLowStock] = useState<number>(0);
  useEffect(() => {
    const count = productResponse.filter((product) => {
      return (
        product.quantity !== undefined && product.quantity <= product.stockAlert
      );
    }).length;

    console.log("productResponse",productResponse)
    setLowStock(count);
  }, [productResponse]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Low Stock Product</CardTitle>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{lowStock}</div>
        <Link href={"/product/low-stock"}>
          <p className="text-xs text-muted-foreground hover:underline cursor-pointer">
            View Details
          </p>
        </Link>
      </CardContent>
    </Card>
  );
};

export default LOWSTOCK;
