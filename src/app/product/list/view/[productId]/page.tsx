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
  const [components, setComponents] = useState<ProductFormState[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingComponents, setLoadingComponents] = useState<boolean>(false);
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

  // Fetch components one by one in parallel using Promise.all
  const getComponents = async (componentIds: string[]) => {
    if (componentIds.length === 0) {
      setComponents([]);
      return;
    }
    setLoadingComponents(true);
    try {
      const componentsData = await Promise.all(
        componentIds.map(async (id) => {
          const res = await fetch(`/api/product/${id}`);
          if (!res.ok) throw new Error(`Failed to fetch component with id ${id}`);
          const data = await res.json();
          return data.response as ProductFormState;
        })
      );
      setComponents(componentsData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoadingComponents(false);
    }
  };

  useEffect(() => {
    if (productId) {
      getProductById(productId);
    }
  }, [productId]);

  useEffect(() => {
    if (product?.isBundle && Array.isArray(product.components)) {
      getComponents(product.components as string[]);
    }
  }, [product]);

  if (loading) {
    return (
      <div className="m-6 w-full">
        {/* Skeleton Placeholder for Product Details */}
        <Skeleton className="h-72 w-72 mb-4" />
        <Skeleton className="h-4 w-1/3 mb-4" />
        <Skeleton className="h-4 w-1/3 mb-4" />
        <Skeleton className="h-4 w-1/3 mb-4" />
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
  const imageSrc =
  Array.isArray(product?.images) && product.images.length > 0
    ? product.images[0]
    : "/product/no-image-product.jpg";
  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-4">Product Details</h1>

      {/* Product Image */}
      <div className="mb-6 w-72 h-72 flex items-center justify-center overflow-hidden">
        <Image
          src={imageSrc}
          alt="no-product-image"
          width={320}
          height={320}
        />
      </div>

      {/* Main Product Details */}
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

      {/* Bundle Components Table */}
      {product.isBundle && (
        <>
          <h2 className="text-xl font-semibold mt-8 mb-4">Bundle Components</h2>
          {loadingComponents ? (
            <p>Loading components...</p>
          ) : components.length === 0 ? (
            <p>No components found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Product Cost</TableHead>
                   <TableHead>whole Sale Price</TableHead>
                    <TableHead>Sell price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((comp,index) => (
                  <TableRow key={`${comp._id}-${index}`}>
                    <TableCell>{comp.productName}</TableCell>
                    <TableCell>{comp.category}</TableCell>
                    <TableCell>{comp.size}</TableCell>
                    <TableCell>{comp.quantity ?? "N/A"}</TableCell>
                    <TableCell>{comp.productCost}</TableCell>
                    <TableCell>{comp.wholesalePrice}</TableCell>
                    <TableCell>{comp.sellPrice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      <Button variant="outline" className="mt-6" onClick={() => router.back()}>
        Back
      </Button>
    </div>
  );
};

export default ProductDetailPage;
