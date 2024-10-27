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
  const [selectedWholesaler, setSelectedWholesaler] = useState<IWholesaler | null>(null);
  const [products, setProducts] = useState<ProductFormState[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductFormState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/product");
      if (response?.data?.response) {
        setProducts(response.data.response);
      } else {
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

  // Calculate grand total whenever selected products change
  useEffect(() => {
    const total = selectedProducts.reduce(
      (sum, product) => sum + product.sellPrice * (product.quantity || 0),
      0
    );
    setGrandTotal(total);
  }, [selectedProducts]);

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
          setError(`Product "${selectedProduct.productName}" is already in the list.`);
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
    if (event.target.checked) setPaidAmount(0); // Reset paid amount if fully paid
  };

  const handlePaidAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(event.target.value);
    setPaidAmount(isNaN(amount) ? 0 : amount);
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

    const totalDue = selectedWholesaler.pendingBalance + grandTotal;
    const pendingBalance = isPaid ? 0 : totalDue - (paidAmount || 0);
    const paymentStatus = pendingBalance <= 0 ? "Clear" : "Pending";
    
    const purchaseDetails = {
      wholesaler: {
        _id: selectedWholesaler._id,
        name: selectedWholesaler.name,
        location: selectedWholesaler.location,
        phone: selectedWholesaler.phone,
        paymentStatus,
        pendingBalance: pendingBalance > 0 ? pendingBalance : 0,
      },
      products: selectedProducts,
      isPaid,
      paidAmount: isPaid ? totalDue : paidAmount,
    };
    
    try {
      const response = await axios.post("/api/purchase", purchaseDetails);
      if (response) {
        toast({ title: "Purchase Confirmed" });
        setSelectedWholesaler(null);
        setSelectedProducts([]);
        setIsPaid(false);
        setPaidAmount(0);
      } else {
        setError("Failed to confirm purchase.");
      }
    } catch (error) {
      console.error("Error confirming purchase:", error);
      setError("Error confirming purchase.");
    }
  };

  const handleDeletePurchaseId = (id: string) => {
    const updatedProductList = selectedProducts.filter(
      (product) => product._id !== undefined && product?._id !== id
    );
    setSelectedProducts(updatedProductList);
  };

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Purchase" subfolder="Made Sale" />
      <WholeSalerSelect onSelect={setSelectedWholesaler} />
      {error && <div className="flex justify-end text-red-500 animate-bounce">{error}</div>}
      {selectedWholesaler && (
        <ProductSelect products={products} handleSelectProduct={handleSelectProduct} />
      )}
      {selectedWholesaler && (
        <div className="rounded-lg shadow-md">
          <Bill
            wholesaler={selectedWholesaler}
            products={selectedProducts}
            onQuantityChange={handleQuantityChange}
            onPriceChange={handlePriceChange}
            handleDeletePurchaseId={handleDeletePurchaseId}
          />
          <div className="flex justify-end mt-4 p-4 border-t flex-col">
            <p className=" font-semibold">Total: Rs {grandTotal.toFixed(2)}</p>
            <p className=" font-semibold mt-2">
             Pending Balance: Rs {(selectedWholesaler.pendingBalance).toFixed(2)}
            </p>
            <p className=" font-semibold mt-2">
              Grand Total: Rs {(selectedWholesaler.pendingBalance + grandTotal).toFixed(2)}
            </p>
            <div className="flex flex-col mt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="billPaid"
                  checked={isPaid}
                  onChange={handleBillPaidChange}
                  className="mr-2"
                />
                <label htmlFor="billPaid">Full Bill Paid</label>
              </div>
              {!isPaid && (
                <div className="mt-2">
                  <label htmlFor="paidAmount" className="block text-sm">
                    Amount Paid:
                  </label>
                  <input
                    type="number"
                    id="paidAmount"
                    value={paidAmount}
                    onChange={handlePaidAmountChange}
                    className="p-2 border rounded"
                    placeholder="Enter amount paid"
                  />
                </div>
              )}
              <Button onClick={handleSubmit} className="mt-4">
                Confirm Purchase
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasePage;
