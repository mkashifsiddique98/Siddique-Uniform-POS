"use client";
<<<<<<< HEAD

import React, { useState, useEffect, useCallback, useRef } from "react";
=======
import React, { useState, useEffect, useCallback } from "react";
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
import Customer from "./customer";
import BillTable from "./bill-table";
import { customer } from "@/types/customer";
import { Input } from "@/components/ui/input";
<<<<<<< HEAD
import { useGlobalBarcodeScanner } from "@/hooks/useGlobalBarcodeScanner";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
import {
  addMultipleToChart,
  clearChart,
  setDiscount,
  setInvoiceNumber,
<<<<<<< HEAD
  updateChart,
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";
import { canonicalizeLines } from "@/lib/posHelpers";
=======
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";

>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

interface BillBookProps {
  listCustomer: customer[];
  invoiceNo: number;
}

const BillBook: React.FC<BillBookProps> = ({ listCustomer, invoiceNo }) => {
  const dispatch = useAppDispatch();

<<<<<<< HEAD
  const invoicestateno = useTypedSelector(
    (state) => state.invoice.invoiceNumber
  );
=======
  // Redux selectors
  const invoicestateno = useTypedSelector(
    (state) => state.invoice.invoiceNumber
  );

  // Local state
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  const [customerDetailList, setCustomerDetailList] =
    useState<customer[]>(listCustomer);
  const [selectedCustomer, setSelectedCustomer] = useState<customer>();
  const [customerName, setCustomerName] = useState<string>("wake-in-customer");
  const [editInvoice, setEditInvoice] = useState<boolean>(false);
  const [invoiceNumberChange, setInvoiceNumberChange] = useState<
    number | string
  >(invoiceNo);
<<<<<<< HEAD
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  // Mongo _id of the invoice loaded for editing (needed to cancel its saved returns)
  const [loadedInvoiceId, setLoadedInvoiceId] = useState<string>();

  // Barcode input state
  const [barcodeInput, setBarcodeInput] = useState<string>("");

  // Product Lookup API handler
  const handleScanProduct = useCallback(
    async (barcode: string) => {
      const trimmedCode = barcode.trim();
      if (!trimmedCode) return;

      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/product/searchbybarcode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barcode: trimmedCode }),
        });

        if (!response.ok) {
          setErrorMessage(`Product with barcode "${trimmedCode}" not found.`);
          return;
        }

        const { product } = await response.json();

        if (product) {
          dispatch(
            updateChart({
              ...product,
              stock: product.isBundle ? undefined : Math.max(0, product.quantity),
              retailPrice: product.sellPrice,
              quantity: 1,
            })
          );
          // CLEAR INPUT BOX AFTER PRODUCT IS ADDED
          setBarcodeInput("");
        }
      } catch (error) {
        console.error("Error scanning product:", error);
        setErrorMessage("Failed to process barcode lookup.");
      } finally {
        setLoading(false);
      }
    },
    [dispatch]
  );

  // Attach background scanner listener
  useGlobalBarcodeScanner({
    inputId: "barcode-search-input",
    onScan: (barcode) => {
      setBarcodeInput(barcode);
      handleScanProduct(barcode);
    },
  });

  // Manual Enter key handler inside input field
  const handleManualSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScanProduct(barcodeInput);
    }
  };

=======
  const [errorMessage,setErrorMessage] =useState<string>("")
  const [loading,setLoading] = useState(false)
  
  // Helper function to fetch customer data
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  const handleGetAllCustomer = useCallback(async () => {
    try {
      const response = await fetch("/api/customer", { method: "GET" });
      if (response.ok) {
        const { listCustomer } = await response.json();
        setCustomerDetailList(listCustomer);
      }
<<<<<<< HEAD
=======

>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  }, []);
<<<<<<< HEAD

  const getInvoiceDetailbyNo = useCallback(async () => {
    dispatch(clearChart());
    dispatch(setDiscount(0));
    try {
      setLoading(true);
      const response = await fetch("/api/invoice/GET_BY_ID", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNo: invoiceNumberChange }),
      });

      if (!response.ok) {
=======
 
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
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
        setLoading(false);
        setErrorMessage(`Invoice No. ${invoiceNumberChange} not found`);
        return;
      }
<<<<<<< HEAD

      const data = await response.json();

      if (data.response) {
        const { customer, productDetail, invoiceNo, discount, _id } = data.response;
        setLoadedInvoiceId(_id ? String(_id) : undefined);
        setCustomerName(customer.customerName);
        dispatch(addMultipleToChart(canonicalizeLines(productDetail)));
        dispatch(setInvoiceNumber(invoiceNo));
        dispatch(setDiscount(discount));
      } else {
        setErrorMessage(
          `Invalid response for Invoice No. ${invoiceNumberChange}`
        );
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      setErrorMessage("An error occurred while fetching the invoice.");
    } finally {
      setLoading(false);
    }
  }, [dispatch, invoiceNumberChange]);

=======
    
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
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  useEffect(() => {
    const normalizedInput = customerName?.toLowerCase().replace(/\s+/g, "");
    const filteredCustomer = customerDetailList.find(
      (customer) =>
<<<<<<< HEAD
        customer.customerName.toLowerCase().replace(/\s+/g, "") ===
        normalizedInput
    );
    setSelectedCustomer(filteredCustomer);
  }, [customerName, customerDetailList]);

  const editInvoiceRef = useRef(false);
  editInvoiceRef.current = editInvoice;

  useEffect(() => {
    // Server-provided preview only; never derived from localStorage.
    // A stock refresh re-sends this prop, so it must not overwrite the number of an invoice being edited.
    if (editInvoiceRef.current) return;
    dispatch(setInvoiceNumber(invoiceNo));
  }, [invoiceNo, dispatch]);

  const handleEditInvoice = () => {
    setEditInvoice((prev) => !prev);
    setLoadedInvoiceId(undefined);
    dispatch(clearChart());
    setLoading(false);
    setErrorMessage("");
  };

  const handleChangeInvoiceNumber = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
=======
        customer.customerName.toLowerCase().replace(/\s+/g, "") === normalizedInput
    );
    setSelectedCustomer(filteredCustomer);
  }, [customerName, customerDetailList]);
  

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
  // 
  const handleChangeInvoiceNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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
<<<<<<< HEAD
      <div className="flex items-center gap-2 flex-wrap">
        {!editInvoice ? (
          <div
            title="Next number (preview)"
            className="h-10 w-16 border flex justify-center items-center rounded-md font-extrabold"
          >
=======
      <div className="flex items-center gap-2">
        {!editInvoice ? (
          <div className="h-10 w-16 border flex justify-center items-center rounded-md font-extrabold">
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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
<<<<<<< HEAD

=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
        <Customer
          customerDetailList={customerDetailList}
          handleChangeValue={setCustomerName}
          handleGetAllCustomer={handleGetAllCustomer}
        />

<<<<<<< HEAD
        <div className="flex-1 min-w-[200px]">
          <Input
            id="barcode-search-input"
            type="text"
            placeholder="Scan or type barcode..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleManualSearch}
            className="border-2 border-primary focus:ring-2"
          />
        </div>
      </div>

      <div className="mt-4">
        <BillTable
=======
      </div>
      <div className="mt-4">
      <BillTable
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
          editInvoice={editInvoice}
          handleEditInvoice={handleEditInvoice}
          selectedCustomer={selectedCustomer}
          errorMessage={errorMessage}
          loading={loading}
<<<<<<< HEAD
          invoiceId={loadedInvoiceId}
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
        />
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default BillBook;
=======
export default BillBook;
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
