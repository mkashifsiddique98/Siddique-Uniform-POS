"use client";
import { IWholesaler } from "@/models/wholesaler";
import React, { useEffect, useState } from "react";
import WholeSalerSelect from "./WholesalerSelect";
import BreadCrum from "@/components/custom-components/bread-crum";
import { ProductFormState } from "@/types/product";
import ProductSelect from "./ProductSelect";
import axios from "axios";
import Bill from "./BillCom";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";

const PurchasePage = () => {
  const [selectedWholesaler, setSelectedWholesaler] =
    useState<IWholesaler | null>(null);
  const [products, setProducts] = useState<ProductFormState[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductFormState[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(false); // State to track if bill is paid

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/product");
      if (response?.data?.response) {
        console.log("Fetched Products:", response.data.response);
        setProducts(response.data.response);
      } else {
        console.error("Invalid response structure", response);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products", error);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSelectProduct = (selectedOption: any) => {
    const selectedProduct = products.find(
      (product) =>
        product._id === selectedOption.value ||
        product.productName === selectedOption.label
    );
    if (selectedProduct) {
      setSelectedProducts((prevSelectedProducts) => {
        const existingProduct = prevSelectedProducts.find(
          (product) =>
            product._id === selectedProduct._id ||
            product.productName === selectedProduct.productName
        );
        if (existingProduct) {
          setError(
            `Product "${selectedProduct.productName}" is already in the list.`
          );
          return prevSelectedProducts;
        } else {
          setError(null);
          return [
            ...prevSelectedProducts,
            {
              ...selectedProduct,
              quantity: 1,
              sellPrice: selectedProduct.sellPrice || 0,
            },
          ];
        }
      });
    } else {
      console.error("Product not found:", selectedOption.value);
    }
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    setSelectedProducts((prevSelectedProducts) =>
      prevSelectedProducts.map((product: any) =>
        product._id === id ? { ...product, quantity: newQuantity } : product
      )
    );
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setSelectedProducts((prevSelectedProducts) =>
      prevSelectedProducts.map((product: any) =>
        product._id === id ? { ...product, sellPrice: newPrice } : product
      )
    );
  };

  const handleBillPaidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsPaid(event.target.checked);
  };

  const handleSubmit = async () => {
    if (!selectedWholesaler) {
      setError("Please select a wholesaler.");
      return;
    }

    if (selectedProducts.length === 0) {
      setError("Please select at least one product.");
      return;
    }
    // Calculating 
    const purchaseDetails = {
      wholesaler: {
        name: selectedWholesaler.name,
        location: selectedWholesaler.location,
        phone: selectedWholesaler.phone,
        paymentStatus: isPaid ? "Clear" : "Pending",
        pendingBalance:
          selectedWholesaler.pendingBalance +
          (isPaid
            ? 0
            : products.reduce(
                (sum, product) =>
                  sum + product.sellPrice * (product.quantity || 0),
                0
              )),
      },
      products: selectedProducts,
      isPaid,
    };
    console.log(purchaseDetails);
    try {
      const response = await axios.post("/api/purchase", purchaseDetails);
      console.log(purchaseDetails);
      if (response) {
        toast({ title: "Purchase Confirmed" });
        // Clear the form or redirect if needed
        setSelectedWholesaler(null);
        setSelectedProducts([]);
        setIsPaid(false);
      } else {
        setError("Failed to confirm purchase.");
      }
    } catch (error) {
      console.error("Error confirming purchase:", error);
      setError("Error confirming purchase.");
    }
  };

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Purchase" subfolder="Made Sale" />
      <WholeSalerSelect onSelect={setSelectedWholesaler} />

      <ProductSelect
        products={products}
        handleSelectProduct={handleSelectProduct}
      />

      {error && (
        <div className="flex justify-end text-red-500 animate-bounce">
          {error}
        </div>
      )}
      {selectedWholesaler && (
        <div>
          <Bill
            wholesaler={selectedWholesaler}
            products={selectedProducts}
            onQuantityChange={handleQuantityChange}
            onPriceChange={handlePriceChange}
          />
          <div className="flex justify-end">
            <div className="flex flex-col p-4">
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="billPaid"
                  checked={isPaid}
                  onChange={handleBillPaidChange}
                  className="mr-2"
                />
                <label htmlFor="billPaid">Bill Paid</label>
              </div>
              <Button onClick={handleSubmit}>Confirm purchase</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasePage;
