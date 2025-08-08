"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Purchase } from "@/types/purchase";
import { Skeleton } from "@/components/ui/skeleton";

const PurchaseDetail: React.FC<{ params: { viewid: string } }> = ({
  params,
}) => {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { viewid } = params;

  const getPurchaseById = async (purchaseId: string) => {
    try {
      const res = await fetch(`/api/purchase/${purchaseId}`);
      if (!res.ok) throw new Error("Failed to fetch purchase");
      const data = await res.json();
      const { response } = data;
      if (response) setPurchase(response);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewid) {
      getPurchaseById(viewid);
    }
  }, [viewid]);

  if (loading) {
    return (
      <div className="w-full">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[100vh]">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex justify-center items-center h-[100vh]">
        <p>No purchase found.</p>
      </div>
    );
  }

  const ProductTable: React.FC<{ products: Purchase['products'] }> = ({
    products,
  }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold">Product Name</TableHead>
          <TableHead className="font-bold">Quantity</TableHead>
          <TableHead className="font-bold">Price</TableHead>
          <TableHead className="font-bold">Line Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product, index) => (
          <TableRow key={index}>
            <TableCell>{product.productName}</TableCell>
            <TableCell>{product.quantity}</TableCell>
            <TableCell>Rs {product.productCost}</TableCell>
            <TableCell>Rs {(product.quantity ?? 0) * product.productCost}</TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell colSpan={2}></TableCell>
          <TableCell className="font-bold">Grand Total</TableCell>
          <TableCell className="font-bold">
            Rs{" "}
            {products.reduce(
              (total, product) => total + product.productCost * (product.quantity ?? 0),
              0
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-4">Purchase Details</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Purchase ID</TableHead>
            <TableHead>Purchase Date</TableHead>
            <TableHead>Wholesaler Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Pending Balance</TableHead>
            <TableHead>Payment Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{purchase._id}</TableCell>
            <TableCell>{new Date(purchase.createdAt).toLocaleDateString()}</TableCell>
            <TableCell>{purchase.wholesaler.name}</TableCell>
            <TableCell>{purchase.wholesaler.location}</TableCell>
            <TableCell>Rs {purchase.wholesaler.pendingBalance}</TableCell>
            <TableCell>{purchase.wholesaler.paymentStatus}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <h2 className="text-xl font-semibold mb-2">Product Details</h2>

      {purchase.products && purchase.products.length > 0 ? (
        <ProductTable products={purchase.products} />
      ) : (
        <p className="mt-2">No products in this purchase.</p>
      )}

      <Button variant="outline" className="mt-6" onClick={() => router.back()}>
        Back
      </Button>
    </div>
  );
};

export default PurchaseDetail;
