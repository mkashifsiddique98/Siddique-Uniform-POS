"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductFormState } from "@/types/product";
import Image from "next/image";

const ProductDetailPage: React.FC<{ params: { productId: string } }> = ({
  params,
}) => {
  const [product, setProduct] = useState<ProductFormState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { productId } = params;

  const getProductById = async (id: string) => {
    try {
      const res = await fetch(`/api/product/${id}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      const data = await res.json();
      const { response } = data;
      if (response) setProduct(response);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      getProductById(productId);
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="m-6 w-full">
        {/* Skeleton Placeholder for Product Details */}
        <Skeleton className="h-72 w-72 mb-4" />
        <Skeleton className="h-4 w-1/3 mb-4" />
        <Skeleton className="h-4 w-1/3 mb-4" />
        <Skeleton className="h-4 w-1/3 mb-4" />
         {/* Image Placeholder */}
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

  if (!product) {
    return (
      <div className="flex justify-center items-center h-[100vh]">
        <p>No product found.</p>
      </div>
    );
  }

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-4">Product Details</h1>

      {/* Product Image Placeholder */}
      <div className="mb-6 w-72 h-72 flex items-center justify-center">
        <Image src="/product/no-image-product.jpg" alt="no-product-image" width={320} height={320}/>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Product Name</TableCell>
            <TableCell>{product.productName}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>School Name</TableCell>
            <TableCell>{product.schoolName}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Supplier</TableCell>
            <TableCell>{product.supplier || "N/A"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Category</TableCell>
            <TableCell>{product.category}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Size</TableCell>
            <TableCell>{product.size}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Stock Alert</TableCell>
            <TableCell>{product.stockAlert}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Sell Price</TableCell>
            <TableCell>Rs {product.sellPrice}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Wholesale Price</TableCell>
            <TableCell>Rs {product.wholesalePrice}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Product Cost</TableCell>
            <TableCell>Rs {product.productCost}</TableCell>
          </TableRow>
          {product.quantity !== undefined && (
            <TableRow>
              <TableCell>Quantity</TableCell>
              <TableCell>{product.quantity}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Button variant="outline" className="mt-6" onClick={() => router.back()}>
        Back
      </Button>
    </div>
  );
};

export default ProductDetailPage;
