export const getAllProductDetail = async () => {
  try {
    const response = await fetch("/api/product/", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const products = await response.json();
    return products.response;
  } catch (error: any) {
    console.error("Error fetching product data:", error.message);
  }
};
export const handleSingleRowDataFn = async (_id?: object) => {
  try {
    const response = await fetch("/api/product/", {
      method: "DELETE",
      body: JSON.stringify({ _id: _id as unknown as string }),
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
// Bulk delete deletion
export const handleBulkRowDataFn = async (rowList: Product[]) => {
  try {
    const res = await fetch("/api/product/bulk-delete", {
      method: "DELETE",
      body: JSON.stringify(rowList),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    } else {
      return res;
    }
  } catch (error: any) {
    console.error("Error fetching product data:", error.message);
  }
};
// components/PdfGenerator.ts
import jsPDF, { jsPDFOptions } from "jspdf";
import "jspdf-autotable";
import { ProductFormState as Product } from "@/types/product";
import * as XLSX from "xlsx";
export const generatePDF = (data: Product[]) => {
  const options: jsPDFOptions = {
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  };

  const doc = new jsPDF(options);

  // Add content to the PDF
  doc.setFontSize(18);
  doc.text("Product List", doc.internal.pageSize.getWidth() / 2, 10, {
    align: "left",
  });

  // Map data to rearrange columns and remove "Stock Alert"
  const rearrangedData = data.map(({ stockAlert, ...rest }) => rest);

  // Add table to PDF
  (doc as any).autoTable({
    head: [
      [
        "Product Name",
        "School Name",
        "Size",
        "Quantity",
        "Product Cost",
        "Wholesale Price",
        "Sell Price",
      ],
    ],
    body: rearrangedData.map((row) => [
      row.productName,
      row.schoolName,
      row.size,
      row.quantity,
      row.productCost,
      row.wholesalePrice,
      row.sellPrice,
    ]),
    startY: 20,
    margin: { top: 20, right: 10, bottom: 10, left: 10 },
  });

  // Save the PDF
  doc.save("product_list.pdf");

  console.log("PDF generated successfully");
};

// Generate Excel file
export const generateExcel = (data: Product[]) => {
  // remove feild
  const modifiedData = data.map(({ _id, __v, ...rest }) => rest);
  // Define the order of fields in the Excel sheet
  const fieldsOrder = [
    "id",
    "productName",
    "schoolName",
    "size",
    "stockAlert",
    "quantity",
    "productCost",
    "wholesalePrice",
    "sellPrice",
  ];
  const arrangedData = modifiedData.map((item: any) =>
    fieldsOrder.reduce((acc: any, field: string) => {
      acc[field] = item[field];
      return acc;
    }, {})
  );

  // create sheet
  const ws = XLSX.utils.json_to_sheet(arrangedData);
  const columnWidths = [
    { wch: 5 }, // id
    { wch: 20 }, // productName
    { wch: 20 }, // schoolName
    { wch: 10 }, // size
    { wch: 10 }, // stockAlert
    { wch: 10 }, // quantity
    { wch: 15 }, // productCost
    { wch: 15 }, // wholesalePrice
    { wch: 15 }, // sellPrice
  ];

  // Apply column widths to the worksheet

  ws["!cols"] = columnWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Product List");
  XLSX.writeFile(wb, "product_list.xlsx");

  console.log("Excel sheet generated successfully");
};
// Import Excel file

export const readExcelFile = (
  file: File
): Promise<{ products?: Product[]; message?: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const workbook = XLSX.read(result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Assuming the first row contains headers
        const headers = data[0];
        const products: Product[] = [];
        // Required fields
        const requiredFields = [
          "productName",
          // "schoolName",
          "size",
          "stockAlert",
          "sellPrice",
          "wholesalePrice",
          "productCost",
          "category",
        ];

        for (let i = 1; i < data.length; i++) {
          const rowData = data[i];

          // Check if the row has any non-empty cells
          const hasData = rowData.some(
            (cell: any) => cell !== undefined && cell !== null && cell !== ""
          );

          if (hasData) {
            const product: Product = {} as Product;

            // Validate required fields
            const missingFields = requiredFields.filter(
              (field) => !rowData[headers.indexOf(field)]
            );
            if (missingFields.length > 0) {
              const errorMessage = `Missing required fields: ${missingFields.join(
                ", "
              )}`;
              resolve({ products: [], message: errorMessage });
              return;
            }

            // Assign values from Excel row to product object
            for (let j = 0; j < headers.length; j++) {
              const header = headers[j];
              const value = rowData[j];

              if (header === "components" && typeof value === "string") {
                product[header] = value.includes(",")
                  ? value.split(",").map((v) => v.trim())
                  : [value.trim()];
              } else {
                product[header] = value;
              }
            }

            products.push(product);
          }
        }

        resolve({ products, message: "All products are ready to upload" });
      } catch (error: any) {
        resolve({
          products: undefined,
          message:
            error.message || "An error occurred while processing the file",
        });
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading the file"));
    };

    reader.readAsBinaryString(file);
  });
};

