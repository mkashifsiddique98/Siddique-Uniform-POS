import BreadCrum from "@/components/custom-components/bread-crum";
import { School } from "@/types/school-name";
import React, { useState } from "react";
import AddNewSchool from "./AddNewSchool";
const DOMAIN_NAME = process.env.DOMAIN_NAME;
async function getAllSchoolData() {
  const res = await fetch(`${DOMAIN_NAME}/api/product/school-name`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
export default async function App() {
  const data = await getAllSchoolData();
  const { response } = data;

  return (
    <div className="container mx-auto p-4 ">
      <BreadCrum mainfolder="Product" subfolder="School Name" />
      <AddNewSchool SchoolList={response} />
    </div>
  );
}
