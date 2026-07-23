"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductSelect from "../ProductSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ProductFormState } from "@/types/product";
import BreadCrum from "@/components/custom-components/bread-crum";
import { Delete } from "lucide-react";

const ProductAdjustPage = () => {
  const [products, setProducts] = useState<ProductFormState[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductFormState[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch the complete list of products from the API
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

  // Handle product selection from the dropdown
  const handleSelectProduct = (selectedOption: any) => {
    const normalizeString = (str: string) => str.trim().toLowerCase();
    const selectedProduct = products.find((product) =>
      product._id === selectedOption.value ||
      normalizeString(product.productName) === normalizeString(selectedOption.label)
    );
    if (selectedProduct) {
      setSelectedProducts((prevSelected) => {
        const exists = prevSelected.find(
          (prod) =>
            prod._id === selectedProduct._id ||
            normalizeString(prod.productName) === normalizeString(selectedProduct.productName)
        );
        if (exists) {
          setError(`Product "${selectedProduct.productName}" is already selected.`);
          return prevSelected;
        } else {
          setError(null);
          // Initialize with existing quantity (or default to 0) and cost
          return [
            ...prevSelected,
            { ...selectedProduct, quantity: selectedProduct.quantity || 0 },
          ];
        }
      });
    } else {
      setError("No matching product found.");
    }
  };

  // Handle changes in the adjusted quantity
  const handleQuantityChange = (id: string, newQuantity: number) => {
    setSelectedProducts((prevSelected) =>
      prevSelected.map((prod) =>
        prod?._id === id ? { ...prod, quantity: newQuantity } : prod
      )
    );
  };

  // Handle changes in the product cost (if needed)
  const handlePriceChange = (id: string, newPrice: number) => {
    setSelectedProducts((prevSelected) =>
      prevSelected.map((prod) =>
        prod._id === id ? { ...prod, productCost: newPrice } : prod
      )
    );
  };

  // Remove a product from the adjustment list
  const handleDeleteProduct = (id: string) => {
    setSelectedProducts((prevSelected) =>
      prevSelected.filter((prod) => prod._id !== id)
    );
  };

  // Submit the adjustments (this could be a POST/PUT call to update product details)
  const handleSubmitAdjustments = async () => {
    if (selectedProducts.length === 0) {
      setError("Please select at least one product to adjust.");
      return;
    }

    // Create a payload with the adjusted details
    const adjustments = selectedProducts.map((product) => ({
      _id: product._id,
      quantity: product.quantity,
      productCost: product.productCost,
    }));
    try {
      const response = await axios.post("/api/product/adjust",  adjustments );
      if (response) {
        toast({ title: "Product adjustments confirmed" });
        setSelectedProducts([]);
        fetchProducts();
      }
    } catch (error) {
      console.error("Error confirming adjustments:", error);
      setError("Error confirming adjustments.");
    }
  };

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Purchase" subfolder="Product Ajustment" />
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <ProductSelect products={products} handleSelectProduct={handleSelectProduct} />

      {selectedProducts.length > 0 && (
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>No.</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Current Qty</TableCell>
                <TableCell>Adjusted Qty</TableCell>
                <TableCell>Product Cost</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((product, index) => (
                <TableRow key={product._id+product.productName}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{product.productName}</TableCell>
                  {/* Assuming product.quantity is the current quantity */}
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={product.quantity || 0}
                      onChange={(e) =>
                        handleQuantityChange(
                          product?._id,
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={product.productCost || 0}
                      onChange={(e) =>
                        handlePriceChange(
                          product?._id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                    title="Delete" 
                    className="bg-red-500 hover:bg-red-600"
                    onClick={() => handleDeleteProduct(product?._id)}>
                    <Delete  />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSubmitAdjustments}>
              Confirm Adjustments
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAdjustPage;
