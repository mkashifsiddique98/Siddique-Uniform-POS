import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { getAllProductDetail, readExcelFile } from "./useProduct";
import { ProductFormState as ProductTypes } from "@/types/product";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";
// sub
const ImportProductBtn = ({
  bulkProductUploadFn,
}: {
  bulkProductUploadFn: (
    product: ProductTypes[],
    message: string | undefined
  ) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const selectedFile = event.target.files?.[0];

      if (selectedFile) {
        const { products, message } = await readExcelFile(selectedFile);
        console.log("Products:", products);
        //
        // Clear the file input after reading the file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (products) {
          bulkProductUploadFn(products, message);
        }
      } else {
        console.error("No file selected");
      }
    } catch (error) {
      console.error("Error reading the file:", error);
    }
  };

  return (
    <div>
      <Button
        className=" hover:bg-blue-600 hover:text-white"
        variant="outline"
        onClick={handleButtonClick}
      >
        <Download size={14} />
        &nbsp;Import Product
      </Button>
      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};
// Main

const ImportProductModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
  };
  
  const requiredFields = [
    "productName",
    "schoolName",
    "size",
    "stockAlert",
    "sellPrice",
    "wholesalePrice",
    "productCost",
  ];
  const [bulkProduct, setBulkProduct] = useState<ProductTypes[]>([]);
  const [reMessage, setReMessage] = useState<string | undefined>("");
  const bulkProductUploadFn = (
    product: ProductTypes[],
    message: string | undefined
  ) => {
    setBulkProduct(product);
    setReMessage(message);
  };

  const cancelImportingFn = () => {
    hideModal();
    setBulkProduct([]);
    setReMessage("");
  };
  const saveImportingFn = async () => {
    try {
      hideModal();
      const response = await fetch("/api/product/bulk-create", {
        method: "POST",
        body: JSON.stringify(bulkProduct),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      } else {
        return response;
      }
    } catch (error: any) {
      console.error("Error fetching product data:", error.message);
    }
  };
  return (
    <div>
      {/* Modal toggle */}
      <button
        onClick={showModal}
        className="flex items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        type="button"
      >
        <Download size={14} />
        &nbsp;Import Product
      </button>

      {/* Main modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          // onClick={hideModal}
        >
          <div className="relative bg-white rounded-lg shadow-md dark:bg-gray-700">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <ImportProductBtn bulkProductUploadFn={bulkProductUploadFn} />{" "}
              &nbsp; &nbsp;
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                upload Product in bulk{" "}
                <span className="text-red-500 text-sm">only .xlsx file</span>
              </h3>
              <button
                onClick={hideModal}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              >
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="flex justify-between p-2">
              <div className="max-w-md ">
                <ul className="list-disc space-y-2">
                  {requiredFields.map((fieldName) => (
                    <li key={fieldName} className="text-gray-700 font-semibold">
                      {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}{" "}
                      <span className="text-red-500 font-normal">*</span>{" "}
                      <span className="font-normal">required.</span>
                    </li>
                  ))}
                </ul>
              </div>
              {bulkProduct.length > 0 && (
                <div className="h-56 overflow-auto my-4">
                  List of Products
                  {bulkProduct.map((product, index) => (
                    <li
                      key={product.productName + index}
                      className="border mb-1 list-decimal"
                    >
                      {product.productName}
                    </li>
                  ))}
                </div>
              )}
            </div>
            {reMessage && (
              <div
                className={`my-2 font-semibold text-center underline ${
                  bulkProduct.length > 0 ? `text-black` : `text-red-500`
                }`}
              >
                {reMessage}!
              </div>
            )}
            {/* Modal footer */}
            <div className="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
              <button
                onClick={saveImportingFn}
                disabled={bulkProduct.length <= 0}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:cursor-not-allowed disabled:bg-blue-500"
              >
                Save
              </button>
              <Button
                onClick={cancelImportingFn}
                className="ms-3 text-gray-500 bg-white hover:bg-red-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5  focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportProductModal;
