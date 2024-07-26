import BreadCrum from "@/components/custom-components/bread-crum";
import React from "react";

const page = () => {
  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Purchase" subfolder="make purchase" />
      
    </div>
  );
};

export default page;
