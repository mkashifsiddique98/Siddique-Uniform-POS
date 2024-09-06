"use client";
import React, { useState, useEffect } from "react";
import Customer from "./customer";
import BillTable from "./bill-table";
import { customer } from "@/types/customer";

const BillBook = ({ listCustomer }: { listCustomer: customer[] }) => {
  const [customerDetailList, setCustomerDetailList] =
    useState<customer[]>(listCustomer);
  const [selectedCustomer, setSelectedCustomer] = useState<customer>();
  const [customerName, setCustomerName] = useState<string | undefined>(
    "wake-in-customer"
  );

  const handleChangeValue = (newValue: string | undefined) => {
    setCustomerName(newValue);
  };

  const handleGetAllCustomer = async () => {
    try {
      const response = await fetch("/api/customer", { method: "GET" });

      if (response.ok) {
        const { listCustomer } = await response.json();
        setCustomerDetailList(listCustomer);
      }
    } catch (error) {
      console.error("Error fetching Customer data:", error);
    }
  };

  useEffect(() => {
    const filteredCustomers = customerDetailList.filter(
      (customer) => customer.customerName === customerName
    );

    setSelectedCustomer(filteredCustomers[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerName]);
  // Reset Custoer Name 
 
  return (
    <div className="container m-2">
      <div className="flex gap-2">
        <Customer
          customerDetailList={customerDetailList}
          handleChangeValue={handleChangeValue}
          handleGetAllCustomer={handleGetAllCustomer}
        />
      </div>
      <div className="mt-4">
        <BillTable selectedCustomer={selectedCustomer} />
      </div>
    </div>
  );
};

export default BillBook;
