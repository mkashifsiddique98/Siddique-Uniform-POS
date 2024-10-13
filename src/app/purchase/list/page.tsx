"use client"
import BreadCrum from "@/components/custom-components/bread-crum";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import React, { FC, useEffect, useState } from "react";
import { Purchase } from "@/types/purchase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";

// PurchaseTable Component
interface PurchaseTableProps {
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
}

const PurchaseTable: FC<PurchaseTableProps> = ({ purchases, setPurchases }) => {
  // Sort purchases by createdAt in descending order
  let sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleDeletePurchase = async (id: string) => {
    try {
      const res = await fetch(`/api/purchase`, {
        method: "DELETE",
        body: JSON.stringify({id})
      });

      if (!res.ok) {
        throw new Error("Failed to delete the purchase.");
      }

      // Filter the deleted purchase out of the array and update the state
      const updatedPurchases = sortedPurchases.filter((item) => item._id !== id);
      setPurchases(updatedPurchases);
      toast({
        title:"Successfully Delete Purchase details!",
      })
    } catch (error) {
      console.error("Error deleting purchase:", error);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">#</TableHead>
          <TableHead>Wholesaler Name</TableHead>
          <TableHead>Purchase Date</TableHead>
          <TableHead>Bill Paid</TableHead>
          <TableHead>Total</TableHead>
          <TableHead className="text-center">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedPurchases.map((purchase, index) => (
          <TableRow key={index}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{purchase.wholesaler?.name || "Unknown"}</TableCell>
            <TableCell className="whitespace-nowrap">
              {new Date(purchase?.createdAt).toLocaleDateString()}
              <br />
              {new Date(purchase?.createdAt).toLocaleTimeString()}
            </TableCell>
            <TableCell>{purchase.isPaid ? "Yes" : "No"}</TableCell>
            <TableCell>
              Rs{" "}
              {purchase.products.reduce(
                (total, product) => total + product.productCost,
                0
              )}
            </TableCell>
            <TableCell className="text-center">
              <Link href={`/purchase/list/view/${purchase._id}`}>
                <Button variant="outline">View</Button>
              </Link>

              <Button className="ml-2" onClick={() => handleDeletePurchase(purchase._id)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Main Purchase List Page
const PurchaseList: FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await fetch("/api/purchase");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setPurchases(data?.response || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <div className="container p-6">
        <BreadCrum mainfolder="Purchase" subfolder="List Purchase" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead>Wholesaler Name</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Bill Paid</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4"/></TableCell>
                <TableCell><Skeleton className="h-4" /></TableCell>
                <TableCell><Skeleton className="h-4" /></TableCell>
                <TableCell><Skeleton className="h-4"/></TableCell>
                <TableCell><Skeleton className="h-4" /></TableCell>
                <TableCell><Skeleton className="h-4" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Purchase" subfolder="List Purchase" />
      {purchases.length > 0 ? (
        <PurchaseTable purchases={purchases} setPurchases={setPurchases} />
      ) : (
        <p>No purchases found.</p>
      )}
    </div>
  );
};

export default PurchaseList;
