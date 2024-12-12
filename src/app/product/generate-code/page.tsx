"use client";
import ProductSelect from '@/app/purchase/ProductSelect';
import BreadCrum from '@/components/custom-components/bread-crum';
import { ProductFormState } from '@/types/product';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Barcode from 'react-barcode';

const GenerateCode = () => {
  const [products, setProducts] = useState<ProductFormState[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductFormState | null>(null);

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

  const handleSelectProduct = (selectedOption: any) => {
    const normalizeString = (str: string) => str.trim().toLowerCase();

    const product = products.find(
      (product) =>
        product._id === selectedOption.value ||
        normalizeString(product.productName) === normalizeString(selectedOption.label)
    );

    if (product) {
      setSelectedProduct(product);
    }
  };

  const handlePrint = () => {
    // Trigger print for barcode container only
    const printContent = document.getElementById("barcode-area");
    const printWindow = window.open("", "", "width=800,height=600");
    
    printWindow?.document.write(printContent?.innerHTML || "");
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Product" subfolder="Generate Code" />
      <ProductSelect 
        products={products}
        handleSelectProduct={handleSelectProduct}
      />

      {/* Display barcode only if a product is selected */}
      {selectedProduct && (
        <div id="barcode-area" className="mt-6">
          <h3 className="text-xl font-semibold">Product Barcode</h3>
          <Barcode value={selectedProduct.productName} /> {/* Generate barcode using the product name */}
        </div>
      )}

      <button
        className="mt-4 p-2 bg-blue-500 text-white rounded"
        onClick={handlePrint}
      >
        Print Barcode
      </button>
    </div>
  );
};

export default GenerateCode;
