"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import sizeListTemplate from "../../../../public/size-catgory-template.json";
import { formSchema } from "@/validation/product";
import { toast } from "@/components/ui/use-toast";
import BreadCrum from "@/components/custom-components/bread-crum";
import ProductForm from "@/components/Product/product-form"; // Import the Reused component
async function getAllSchoolDetail() {
  const res = await fetch("http://localhost:3000/api/customer", {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
const Product = () => {
  const [schoolList, setSchoolList] = useState([]);
  useEffect(() => {
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
    getAllSchoolDetail();
  }, []);
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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const response = await fetch("/api/product/", {
      method: "POST",
      body: JSON.stringify(values),
    });
    if (response.ok) {
      form.reset();
      toast({
        title: "Product Created!",
        description: "New Prodcut is Created Successfully!",
      });
    }
  }

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Product" subfolder="Create Product" />
      <ProductForm
        form={form}
        onSubmit={onSubmit}
        sizeListTemplate={sizeListTemplate}
        schoolList={schoolList}
        mode="Add Product"
      />
    </div>
  );
};

export default Product;
