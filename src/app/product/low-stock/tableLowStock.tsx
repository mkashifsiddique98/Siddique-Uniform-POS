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

const TableLowStock = ({
  productResponse,
}: {
  productResponse: ProductFormState[];
}) => {
  const [lowStockProduct, setLowStockProduct] = useState<ProductFormState[]>(
    []
  );
  useEffect(() => {
    const listProduct = productResponse.filter((product) => {
      return (
        product.quantity !== undefined && product.quantity <= product.stockAlert
      );
    });
    setLowStockProduct(listProduct);
  }, [productResponse]);

  return (
    <div className="container">
          <h1 className="font-extrabold m-2 text-center capitalize leading-4 underline">Total Product: {productResponse.length} and low Stock {lowStockProduct.length}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Product Name</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead className="text-right">Stock Alert</TableHead>
            <TableHead>Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStockProduct.map((product, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium whitespace-nowrap">
                {product.productName}
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell className="text-right">{product.stockAlert}</TableCell>
              <TableCell>{product.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableLowStock;
