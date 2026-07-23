"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import sizeListTemplate from "../../../../public/size-catgory-template.json";
import { formSchema } from "@/validation/product";
import { toast } from "@/components/ui/use-toast";
import BreadCrum from "@/components/custom-components/bread-crum";
import ProductForm from "@/components/Product/product-form"; // Reused component
import { ProductFormState } from "@/types/product";

const DOMAIN_NAME = process.env.NEXT_PUBLIC_DOMAIN_NAME || "http://localhost:3000"; // fallback

const Product = () => {
  const [schoolList, setSchoolList] = useState([]);
  const [productList, setProductList] = useState([]);

  // ✅ Fetch school names
  useEffect(() => {
    const fetchSchoolNames = async () => {
      try {
        const res = await fetch("/api/product/school-name");
        const data = await res.json();
        const { response } = data;
        setSchoolList(response);
      } catch (error) {
        console.error("Error fetching school details:", error);
      }
    };
    fetchSchoolNames();
  }, []);

  // ✅ Fetch existing products
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

  // ✅ Hook Form Setup
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
      isBundle: false,
      components: [],
      images:[],
    },
  });

  // ✅ Submit Handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/product/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        form.reset();
        toast({
          title: "Product Created!",
          description: "New product has been created successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Something went wrong while creating the product.",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: "Failed to submit the form.",
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
        // for Bundling...
        productList={productList}
        mode="Add Product"
      />
    </div>
  );
};

export default Product;
