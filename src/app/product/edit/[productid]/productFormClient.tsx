"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formSchema } from "@/validation/product";
import { toast } from "@/components/ui/use-toast";
import ProductForm from "@/components/Product/product-form";
import { ProductFormState } from "@/types/product";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const DOMAIN_NAME =
  process.env.NEXT_PUBLIC_DOMAIN_NAME || "http://localhost:3000"; // fallback

interface ProductFormClientProps {
  product: ProductFormState | null;
  schoolList: any[];
  sizeListTemplate: any[];
  productid?: string;
}

export default function ProductFormClient({
  product,
  schoolList,
  sizeListTemplate,
  productid,
}: ProductFormClientProps) {
  const router = useRouter();
  // for Select product or Linked Product
  const [productList, setProductList] = useState([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
    productName: product?.productName || "",
    schoolName: product?.schoolName || "",
    category: product?.category || "",
    sellPrice: product?.sellPrice || 0,
    wholesalePrice: product?.wholesalePrice || 0,
    stockAlert: product?.stockAlert || 0,
    productCost: product?.productCost || 0,
    size: product?.size || "",
    isBundle: product?.isBundle || false,
    components: product?.components || [],
    images: product?.images || []
  },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const response = await fetch("/api/product/", {
      method: "PUT",
      body: JSON.stringify({ ...values, productid }),
    });
    if (response.ok) {
      form.reset();
      toast({
        description: "Product Updated Successfully!!",
      });
      router.push("/product/list");
    }
  }

  // ✅ Fetch existing products or Bundling 
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const res = await fetch(`${DOMAIN_NAME}/api/product`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setProductList(data.response);
      } catch (error) {
        console.error("Failed to fetch product data:", error);
      }
    };
    fetchProductData();
  }, []);

  return (
    <ProductForm
      form={form}
      onSubmit={onSubmit}
      sizeListTemplate={sizeListTemplate}
      schoolList={schoolList}
      // is for bundling
      productList={productList}
      mode="Edit Product"
    />
  );
}
