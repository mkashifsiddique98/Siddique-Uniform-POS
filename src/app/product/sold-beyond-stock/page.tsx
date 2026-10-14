import React from "react";
import BreadCrum from "@/components/custom-components/bread-crum";
import { serverFetch } from "@/lib/serverFetch";
import { formatShopDate } from "@/lib/formatTime";
import { SoldBeyondStockRow } from "@/lib/soldBeyondStock";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getRows(): Promise<SoldBeyondStockRow[]> {
  try {
    const res = await serverFetch("/api/report/sold-beyond-stock", { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()).response || [];
  } catch (error) {
    console.error("Failed to load sold-beyond-stock report:", error);
    return [];
  }
}

export default async function SoldBeyondStock() {
  const rows = await getRows();
  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Product" subfolder="Sold beyond stock" />
      {rows.length === 0 ? (
        <p className="font-extrabold text-center">Nothing was sold beyond stock.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Sold beyond stock</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead>Last date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.productId}>
                <TableCell className="font-medium">{row.productName}</TableCell>
                <TableCell className="text-right">{row.unstockedQty}</TableCell>
                <TableCell>{row.invoiceNumbers.map((no) => `#${no}`).join(", ")}</TableCell>
                <TableCell>{row.lastDate ? formatShopDate(row.lastDate) : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
