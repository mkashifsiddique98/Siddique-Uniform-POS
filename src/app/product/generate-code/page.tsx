"use client";
<<<<<<< HEAD

import ProductSelect from "@/app/purchase/ProductSelect";
import BreadCrum from "@/components/custom-components/bread-crum";
import { ProductFormState } from "@/types/product";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Barcode from "react-barcode";

interface BulkItem {
  product: ProductFormState;
  quantity: number;
}

const BulkGenerateCode = () => {
  const [products, setProducts] = useState<ProductFormState[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductFormState | null>(null);
  const [printQuantity, setPrintQuantity] = useState<number>(1);
  const [bulkList, setBulkList] = useState<BulkItem[]>([]);

  // Exact physical size of 1 sticker label
  const STICKER_WIDTH = "2in";   // Change to match your roll (e.g. "50mm" or "2in")
  const STICKER_HEIGHT = "1.2in"; // Change to match your roll (e.g. "30mm" or "1.2in")
=======
import ProductSelect from '@/app/purchase/ProductSelect';
import BreadCrum from '@/components/custom-components/bread-crum';
import { ProductFormState } from '@/types/product';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Barcode from 'react-barcode';

const GenerateCode = () => {
  const [products, setProducts] = useState<ProductFormState[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductFormState | null>(null);
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

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
<<<<<<< HEAD
    const product = products.find(
      (p) =>
        p._id === selectedOption.value ||
        normalizeString(p.productName) === normalizeString(selectedOption.label)
    );
    if (product) setSelectedProduct(product);
  };

  const handleAddToQueue = () => {
    if (!selectedProduct || printQuantity < 1) return;

    setBulkList((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product._id === selectedProduct._id
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += printQuantity;
        return updated;
      }

      return [...prev, { product: selectedProduct, quantity: printQuantity }];
    });
  };

  const handleRemoveFromQueue = (index: number) => {
    setBulkList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearQueue = () => {
    setBulkList([]);
  };

  // Direct Browser Native Print Execution
  const handlePrintBulk = () => {
    window.print();
  };

  return (
    <>
      {/* Dynamic CSS Print Injection */}
      <style jsx global>{`
        @media print {
          /* Force physical printer media page size without margins */
          @page {
            size: ${STICKER_WIDTH} ${STICKER_HEIGHT};
            margin: 0 !important;
          }

          /* Hide Web App UI */
          body * {
            visibility: hidden !important;
          }

          /* Show Print Area */
          #bulk-barcode-print-wrapper,
          #bulk-barcode-print-wrapper * {
            visibility: visible !important;
          }

          #bulk-barcode-print-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${STICKER_WIDTH} !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Sticker Page Boundaries */
          .single-sticker {
            width: ${STICKER_WIDTH} !important;
            height: ${STICKER_HEIGHT} !important;
            max-width: ${STICKER_WIDTH} !important;
            max-height: ${STICKER_HEIGHT} !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            padding: 2px !important;
            margin: 0 !important;
            overflow: hidden !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .product-title {
            font-family: Arial, sans-serif !important;
            font-size: 9px !important;
            font-weight: bold !important;
            text-align: center !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 95% !important;
            margin-bottom: 2px !important;
            color: #000000 !important;
          }

          .barcode-container svg {
            max-width: 95% !important;
            height: auto !important;
            max-height: 0.75in !important;
            display: block !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      {/* WEB APP USER INTERFACE */}
      <div className="container p-6">
        <BreadCrum mainfolder="Product" subfolder="Bulk Generate Code" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mt-4">
          <div className="col-span-1 md:col-span-2">
            <ProductSelect
              products={products}
              handleSelectProduct={handleSelectProduct}
            />
          </div>

          <div className="flex gap-2 items-center">
            <div>
              <label className="block text-xs font-semibold mb-1">Qty</label>
              <input
                type="number"
                min="1"
                value={printQuantity}
                onChange={(e) => setPrintQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 p-2 border rounded text-center"
              />
            </div>

            <button
              onClick={handleAddToQueue}
              disabled={!selectedProduct}
              className="p-2 mt-5 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              Add to Print List
            </button>
          </div>
        </div>

        {bulkList.length > 0 && (
          <div className="mt-8 border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Print Queue ({bulkList.reduce((acc, item) => acc + item.quantity, 0)} Total Stickers)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleClearQueue}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  Clear Queue
                </button>
                <button
                  onClick={handlePrintBulk}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 text-sm"
                >
                  Print All Barcodes
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {bulkList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center border-b pb-2 text-sm"
                >
                  <div>
                    <span className="font-semibold">{item.product.productName}</span>{" "}
                    <span className="text-gray-500">
                      (Code: {(item.product as any).productCode || item.product.productName})
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>
                      Copies: <strong>{item.quantity}</strong>
                    </span>
                    <button
                      onClick={() => handleRemoveFromQueue(idx)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HIDDEN IN SCREEN VIEW - ACTIVE DURING PRINTING */}
        <div id="bulk-barcode-print-wrapper" className="hidden print:block">
          {bulkList.flatMap((item, itemIdx) =>
            Array.from({ length: item.quantity }).map((_, copyIdx) => {
              const code =
                (item.product as any).productCode || item.product.productName;
              return (
                <div
                  key={`print-${itemIdx}-${copyIdx}`}
                  className="single-sticker"
                >
                  <div className="product-title">{item.product.productName}</div>
                  <div className="barcode-container">
                    <Barcode
                      value={String(code)}
                      width={1.2}
                      height={30}
                      fontSize={10}
                      margin={0}
                      displayValue={true}
                      background="transparent"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default BulkGenerateCode;
=======

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
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
