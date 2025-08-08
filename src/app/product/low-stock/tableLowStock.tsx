"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductFormState } from "@/types/product";
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TableLowStock = ({
  productResponse,
}: {
  productResponse: ProductFormState[];
}) => {
  const [lowStockProduct, setLowStockProduct] = useState<ProductFormState[]>(
    []
  );
  const [filteredProduct, setFilteredProduct] = useState<ProductFormState[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const listProduct = productResponse.filter((product) => {
      return (
        product.quantity !== undefined &&
        product.stockAlert !== undefined &&
        product.quantity <= product.stockAlert
      );
    });

    setLowStockProduct(listProduct);
    setLoading(false);
  }, [productResponse]);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProduct(lowStockProduct);
    } else {
      setFilteredProduct(
        lowStockProduct.filter((p) => p.category === selectedCategory)
      );
    }
  }, [lowStockProduct, selectedCategory]);

  // Unique category list
  const categories = Array.from(
    new Set(lowStockProduct.map((product) => product.category))
  );

  return (
    <div className="container">
      {/* Category filter */}

      <div className="flex justify-around my-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="category">Filter by Category:</Label>
          <Select
            onValueChange={(value) => setSelectedCategory(value)}
            defaultValue="all"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <h1 className="font-extrabold my-2 text-center text-2xl capitalize leading-4 ">
          Total Products: {productResponse.length} | Low Stock:{" "}
          {lowStockProduct.length}
        </h1>
      </div>
      {/* Skeleton while loading */}
      {loading ? (
        <div className="space-y-4 w-full min-h-screen p-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex space-x-4 justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : filteredProduct.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock Alert</TableHead>
              <TableHead>Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProduct.map((product, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium whitespace-nowrap">
                  {product.productName}
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">
                  {product.stockAlert}
                </TableCell>
                <TableCell>{product.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center text-muted-foreground mt-8">
          No low-stock products found in this category.
        </div>
      )}
    </div>
  );
};

export default TableLowStock;
