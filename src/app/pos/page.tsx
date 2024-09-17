import { Topnav } from "@/components/layout/topnav";
import React from "react";
import ProductBox from "./Product-Box-Pagnation";
import BillBook from "./bill-book";
import Fullscreen from "@/utils/fullScreen";

const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

async function fetchData(endpoint: string) {
  try {
    const res = await fetch(`${DOMAIN_NAME}${endpoint}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`Failed to fetch data from ${endpoint}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    return null;
  }
}

async function getAllCustomerDetail() {
  const customerData = await fetchData("/api/customer");
  return customerData ? customerData : { listCustomer: [] }; // Return an empty array if null
}

async function getAllProductData() {
  const productData = await fetchData("/api/product/");
  return productData ? productData : { response: [] }; // Return an empty array if null
}

const PointOfSale = async () => {
  const data = await getAllProductData();
  const customer = await getAllCustomerDetail();

  const listCustomer = customer?.listCustomer || []; // Ensure it's an empty array if undefined or null
  const response = data?.response || []; // Ensure it's an empty array if undefined or null
  return (
    <div className="flex">
      <Fullscreen />
      {/* Left Side */}
      <div className="h-screen w-6/12 border-r-2 border-black">
        <Topnav />
        <BillBook listCustomer={listCustomer} />
      </div>
      {/* Right Side */}
      <div className="h-screen w-6/12">
        <div className="container">
          <ProductBox items={response} perPage={12} />
        </div>
      </div>
    </div>
  );
};

export default PointOfSale;
