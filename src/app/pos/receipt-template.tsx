import { customer } from "@/types/customer";
import { ProductDetail } from "@/types/invoice";
import React, { FC } from "react";
interface ReceiptTemplateProps {
  selectedCustomer: customer | undefined;
  productList: ProductDetail[];
  discount: number;
  disInPercentage: number;
  grandTotal: number;
  dueDate:Date | null
}
const ReceiptTemplate: FC<ReceiptTemplateProps> = ({
  productList,
  selectedCustomer,
  discount,
  disInPercentage,
  grandTotal,
  dueDate
}) => {
  return (
    <div
      style={{
        width: "70mm",
        fontFamily: "monospace",
        padding: "10px",
        margin: "2px",
      }}
    >
      {/* Header */}
      <h2
        style={{
          textAlign: "center",
          margin: "5px 0",
          fontSize: "22px",
          fontFamily: "fantasy",
          fontWeight: "bold",
          borderBottom: "2px solid black",
          paddingBottom: "5px",
        }}
      >
        Siddique Uniform Centre
      </h2>
      <p style={{ textAlign: "center", margin: "2px 0" }}>
        Saran Market Karianwala
      </p>
      <p style={{ textAlign: "center", margin: "2px 0" }}>Phone: 03086139401</p>

      {/* Receipt Information */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          border: "1px solid black",
          padding: "5px",
          margin: "10px 0",
          borderRadius: "3px",
        }}
      >
        <p style={{ margin: "0", fontWeight: "bold" }}>Receipt No:</p>
        <p style={{ margin: "0" }}>Date: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Customer Info */}
      <p
        style={{
          textAlign: "left",
          textTransform: "capitalize",
          margin: "5px 0",
        }}
      >
        <strong>Customer Name:</strong> {selectedCustomer?.customerName}
      </p>
      <p
        style={{
          textAlign: "left",
          textTransform: "capitalize",
          margin: "5px 0",
        }}
      >
        <strong>Customer Type:</strong> {selectedCustomer?.type}
      </p>

      {/* Product Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "10px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                borderBottom: "1px solid black",
                paddingBottom: "5px",
              }}
            >
              Product
            </th>
            <th
              style={{
                textAlign: "center",
                borderBottom: "1px solid black",
                paddingBottom: "5px",
              }}
            >
              Qty
            </th>
            <th
              style={{
                textAlign: "right",
                borderBottom: "1px solid black",
                paddingBottom: "5px",
              }}
            >
              Price
            </th>
          </tr>
        </thead>
        <tbody>
          {productList.map((product) => (
            <tr key={product.productName}>
              <td style={{ padding: "5px 0" }}>{product.productName}</td>
              <td style={{ textAlign: "center", padding: "5px 0" }}>
                {product.quantity}
              </td>
              <td style={{ textAlign: "right", padding: "5px 0" }}>
                Rs {product.sellPrice}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Discounts and Totals */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "5px 0",
          borderTop: "1px solid black",
        }}
      >
        <span>
          <strong>Discount:</strong>
        </span>
        <span>
          Rs {discount} ({disInPercentage}%)
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 0",
          borderTop: "1px solid black",
          fontWeight: "bold",
        }}
      >
        <span>Grand Total:</span>
        <span>Rs {grandTotal}</span>
      </div>
      
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 0",
          borderTop: "1px solid black",
          fontWeight: "bold",
        }}
      >
        <span>remaining balance:</span>
        <span>Rs {grandTotal}</span>
      </div>
      { selectedCustomer?.type === "special-sitching" && <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 0",
          borderTop: "1px solid black",
          fontWeight: "bold",
        }}
      >
        <span>Due Date for Stitching</span>
        <span>{new Date(dueDate).toLocaleDateString()}</span>
      </div>}
      
      {/* Footer */}
      <p
        style={{
          textAlign: "center",
          margin: "10px 0 0",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        Thank you for shopping with us!
      </p>
      <p
        style={{
          textAlign: "center",
          margin: "0",
          fontSize: "12px",
          fontStyle: "italic",
        }}
      >
        Visit again!
      </p>
    </div>
  );
};

export default ReceiptTemplate;
