import { Topnav } from "@/components/layout/topnav";
import React from "react";
import ProductBox from "./Product-Box-Pagnation";
import BillBook from "./bill-book";
import Fullscreen from "@/utils/fullScreen";

async function getAllCustomerDetail() {
  try {
    const res = await fetch("http://localhost:3000/api/customer", {
      cache: "no-store",
    });
    if (!res.ok) {
      console.log("Failed to fetch data");
    }
  
    return res.json();
  } catch (error) {
     return null 
  }
  
}
async function getAllProductData() {
  try {
    const res = await fetch("http://localhost:3000/api/product/", {
      cache: "no-store",
    });
    if (!res.ok) {
      console.log("Failed to fetch data");
    }
  
    return res.json();
  } catch (error) {
      
     return null  
  }
 
}
const PointOfSale = async () => {
  const data = await getAllProductData();
  const customer = await getAllCustomerDetail();
  const { listCustomer } = customer;
  const { response } = data;
  return (
    <div className="flex">
      <Fullscreen/>
      {/* Left Side */}
      <div className="h-screen w-6/12 border-r-2 border-black ">
        <Topnav />
        <BillBook  listCustomer={listCustomer}/>
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
