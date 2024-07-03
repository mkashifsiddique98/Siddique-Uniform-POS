/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { schoolList, sizeListTemplate } from "@/data";
import { formSchema } from "@/validation/product";
import { toast } from "@/components/ui/use-toast";
import BreadCrum from "@/components/custom-components/bread-crum";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/Product/product-form";
import { ProductFormState } from "@/types/product";

export default  function ProductEdit({
  params,
}: {
  params: { productid: string };
}) {
  const { productid } = params;
  const route = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      schoolName: "",
      category: "",
      size: "",
      sellPrice: 0,
      wholesalePrice: 0,
      stockAlert: 0,
      productCost: 0,
    } as ProductFormState,
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const response = await fetch("/api/product/", {
      method: "PUT",
      body: JSON.stringify(values),
    });
    if (response.ok) {
      form.reset();
      toast({
        description: "Product Updated Successfully!!",
      });
      route.push("/product/list");
    }
  }
  const getProductByID = async (productId: string) => {
    try {
      const response = await fetch(`/api/product/edit`, {
        method: "POST", // Change to GET method to fetch data by ID
        body: JSON.stringify(productId),
      });
      if (!response.ok) {
        toast({
          title: "Server Error",
          variant: "destructive",
        });
        return;
      }
      const product = await response.json();
      const { productName, schoolName, category, size, sellPrice, wholesalePrice, stockAlert, productCost } = product;
       console.log("Data is comming...",product)
      form.setValue("productName", productName);
      form.setValue("schoolName", schoolName);
      form.setValue("category", category);
      form.setValue("size", size);
      form.setValue("sellPrice", sellPrice);
      form.setValue("wholesalePrice", wholesalePrice);
      form.setValue("stockAlert", stockAlert);
      form.setValue("productCost", productCost);
  
    } catch (error: any) {
      console.error("Error fetching product data:", error.message);
    }
  };
  const [schoolList, setSchoolList] = useState([]);
  
    const getAllSchoolDetail = async () => {
      try {
        const res = await fetch("/api/product/school-name");
        const data = await res.json();
        const { response } = data;
        setSchoolList(response);
      } catch (error) {
        console.error("Error fetching school details:", error);
      }
    };
    

  useEffect(() => {
    getProductByID(productid);
    getAllSchoolDetail();
  }, [productid]);
  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Product" subfolder="Edit Product" />
      <ProductForm
        form={form}
        onSubmit={onSubmit}
        sizeListTemplate={sizeListTemplate}
        schoolList={schoolList}
        mode="Edit Product"
      />
    </div>
  );
}
