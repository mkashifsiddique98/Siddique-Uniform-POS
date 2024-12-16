"use client";
import React, { useState, useEffect, useCallback } from "react";
import Customer from "./customer";
import BillTable from "./bill-table";
import { customer } from "@/types/customer";
import { Input } from "@/components/ui/input";
import {
  addMultipleToChart,
  clearChart,
  setDiscount,
  setInvoiceNumber,
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";
import { Button } from "react-day-picker";
import { handleGenerateNewInvoiceNumber } from "./usePos";
import { toast } from "@/components/ui/use-toast";

interface BillBookProps {
  listCustomer: customer[];
  invoiceNo: number;
}

const BillBook: React.FC<BillBookProps> = ({ listCustomer, invoiceNo }) => {
  const dispatch = useAppDispatch();

  // Redux selectors
  const invoicestateno = useTypedSelector(
    (state) => state.invoice.invoiceNumber
  );

  // Local state
  const [customerDetailList, setCustomerDetailList] =
    useState<customer[]>(listCustomer);
  const [selectedCustomer, setSelectedCustomer] = useState<customer>();
  const [customerName, setCustomerName] = useState<string>("wake-in-customer");
  const [editInvoice, setEditInvoice] = useState<boolean>(false);
  const [invoiceNumberChange, setInvoiceNumberChange] = useState<
    number | string
  >(invoiceNo);
  const [errorMessage,setErrorMessage] =useState<string>("")
  const [loading,setLoading] = useState(false)
  // Helper function to fetch customer data
  const handleGetAllCustomer = useCallback(async () => {
    try {
      const response = await fetch("/api/customer", { method: "GET" });
      if (response.ok) {
        const { listCustomer } = await response.json();
        setCustomerDetailList(listCustomer);
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  }, []);

  // Fetch invoice details by invoice number
  const getInvoiceDetailbyNo = useCallback(async () => {
    // Clear chart for new incoming product
    dispatch(clearChart());
    dispatch(setDiscount(0));
    
    
    try {
      setLoading(true); // Start the loading indicator
      const response = await fetch("/api/invoice/GET_BY_ID", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Added headers for clarity
        body: JSON.stringify({ invoiceNo: invoiceNumberChange }),
      });
    
      if (!response.ok) {
        // Handle non-successful responses
        setLoading(false);
        setErrorMessage(`Invoice No. ${invoiceNumberChange} not found`);
        return;
      }
    
      const data = await response.json();
    
      if (data.response) {
        // Process successful response
        const { customer, productDetail, invoiceNo, discount } = data.response;
        setCustomerName(customer.customerName);
        dispatch(addMultipleToChart(productDetail));
        dispatch(setInvoiceNumber(invoiceNo));
        dispatch(setDiscount(discount));
      } else {
        // Handle missing or invalid response structure
        setErrorMessage(`Invalid response for Invoice No. ${invoiceNumberChange}`);
      }
    } catch (error) {
      // Handle fetch or JSON parsing errors
      console.error("Error fetching invoice:", error);
      setErrorMessage("An error occurred while fetching the invoice.");
    } finally {
      setLoading(false); // Ensure loading is stopped in all cases
    }
    
  }, [dispatch, invoiceNumberChange]);

  // Effect to update selected customer based on customerName
  useEffect(() => {
    const filteredCustomers = customerDetailList.find(
      (customer) =>
        customer.customerName.toLowerCase() === customerName?.toLowerCase()
    );
    setSelectedCustomer(filteredCustomers);
  }, [customerName]);

  // Effect to set invoice number when invoiceNo prop changes
  useEffect(() => {
    const storedValue = Number(localStorage.getItem('invoiceNo')) || 0;
    const newInvoiceNumber = Math.max(storedValue, invoiceNo);
      dispatch(setInvoiceNumber(newInvoiceNumber));
      localStorage.setItem('invoiceNo', String(newInvoiceNumber));
  }, [invoiceNo]);

  // Handlers for editing invoice number
  const handleEditInvoice = () => {
    setEditInvoice((prev) => !prev)
    dispatch(clearChart())
    setLoading(false)
    setErrorMessage("")
  };

  const handleChangeInvoiceNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isNaN(Number(value)) || value === "") {
      setInvoiceNumberChange(value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      getInvoiceDetailbyNo();
    }
  };

  return (
    <div className="container m-2">
      <div className="flex items-center gap-2">
        {!editInvoice ? (
          <div className="h-10 w-16 border flex justify-center items-center rounded-md font-extrabold">
            {invoicestateno === 0 ? invoiceNo : invoicestateno}
          </div>
        ) : (
          <Input
            className="h-10 w-16"
            placeholder="1"
            min={0}
            value={invoiceNumberChange}
            onKeyDown={handleKeyDown}
            onChange={handleChangeInvoiceNumber}
          />
        )}
        <Customer
          customerDetailList={customerDetailList}
          handleChangeValue={setCustomerName}
          handleGetAllCustomer={handleGetAllCustomer}
        />

      </div>
      <div className="mt-4">
      <BillTable
          editInvoice={editInvoice}
          handleEditInvoice={handleEditInvoice}
          selectedCustomer={selectedCustomer}
          errorMessage={errorMessage}
          loading={loading}
        />
        
      </div>
    </div>
  );
};

export default BillBook;
