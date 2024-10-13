"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Purchase } from "@/types/purchase"; // Assuming you're using a Purchase type
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFormState } from "@/types/product";

const PurchaseDetail: React.FC<{ params: { viewid: string } }> = ({ params }) => {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { viewid } = params;

  const getPurchaseById = async (purchaseId: string) => {
    try {
      const res = await fetch(`/api/purchase/GET_BY_ID/${purchaseId}`);
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
        {/* Table Header Skeleton */}
        <div className="flex items-center space-x-4 p-4">
          <Skeleton className="h-4 w-1/6" /> {/* Column 1 */}
          <Skeleton className="h-4 w-1/6" /> {/* Column 2 */}
          <Skeleton className="h-4 w-1/6" /> {/* Column 3 */}
          <Skeleton className="h-4 w-1/6" /> {/* Column 4 */}
          <Skeleton className="h-4 w-1/6" /> {/* Column 5 */}
        </div>

        {/* Table Rows Skeleton */}
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-4 w-1/6" /> {/* Row 1 */}
            <Skeleton className="h-4 w-1/6" /> {/* Row 2 */}
            <Skeleton className="h-4 w-1/6" /> {/* Row 3 */}
            <Skeleton className="h-4 w-1/6" /> {/* Row 4 */}
            <Skeleton className="h-4 w-1/6" /> {/* Row 5 */}
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

  const ProductTable: React.FC<{ products: ProductFormState[] }> = ({
    products,
  }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold">Product Name</TableHead>
          <TableHead className="font-bold">Quantity</TableHead>
          <TableHead className="font-bold">Wholesale Price</TableHead>
          <TableHead className="font-bold">Line Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product, index) => (
          <TableRow key={index}>
            <TableCell>{product.productName}</TableCell>
            <TableCell>{product.quantity ?? 0}</TableCell> {/* Fallback for undefined */}
            <TableCell>Rs {product.wholesalePrice}</TableCell>
            <TableCell>
              Rs {(product.quantity ?? 0) * product.wholesalePrice}
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell colSpan={2}></TableCell>
          <TableCell className="font-bold">Grand Total</TableCell>
          <TableCell className="font-bold">Rs {purchase.products.reduce(
                (total, product) => total + product.productCost,
                0
              )}</TableCell>
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
            <TableHead>Wholesaler Contact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{purchase._id}</TableCell>
            <TableCell>
              {new Date(purchase.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>{purchase.wholesaler.name}</TableCell>
            <TableCell>{purchase.wholesaler.phone}</TableCell>
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
