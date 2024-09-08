"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formSchema } from "@/validation/product";
import { toast } from "@/components/ui/use-toast";
import ProductForm from "@/components/Product/product-form";
import { ProductFormState } from "@/types/product";
import { useRouter } from "next/navigation";

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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:
      product ||
      ({
        productName: "",
        schoolName: "",
        category: "",
        size: "",
        sellPrice: 0,
        wholesalePrice: 0,
        stockAlert: 0,
        productCost: 0,
      } as ProductFormState),
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

  return (
    <ProductForm
      form={form}
      onSubmit={onSubmit}
      sizeListTemplate={sizeListTemplate}
      schoolList={schoolList}
      mode="Edit Product"
    />
  );
}
