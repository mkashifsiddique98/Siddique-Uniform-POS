import { Topnav } from "@/components/layout/topnav";
import React from "react";
import ProductBox from "./Product-Box-Pagnation";

import Fullscreen from "@/utils/fullScreen";
import dynamic from "next/dynamic";
import BillBook from "./bill-book";
import { School } from "@/types/school-name";

const DOMAIN_NAME = process.env.DOMAIN_NAME ;

async function fetchData(endpoint: string) {
  try {
    const res = await fetch(`${DOMAIN_NAME}${endpoint}`, 
      {
        next: { revalidate: 60 },
    
    }
  );

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
async function getAllSchoolData() {
  const SchoolData = await fetchData("/api/product/school-name");
  return SchoolData ? SchoolData : { response: [] }; // Return an empty array if null
}

// ***************************** Main ********************
const PointOfSale = async () => {
   // All Product
  const data = await getAllProductData();
//  All customer
  const customer = await getAllCustomerDetail();
 
  const listCustomer = customer?.listCustomer || []; // Ensure it's an empty array if undefined or null
  const response = data?.response || []; // Ensure it's an empty array if undefined or null
  // School List
  const SchoolArray =await getAllSchoolData() 
  const SchoolList:School[] = SchoolArray.response || []
 
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
          <ProductBox 
          schoolList={SchoolList}
          items={response} perPage={16} />
        </div>
      </div>
    </div>
  );
};

export default PointOfSale;
