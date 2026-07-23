/* eslint-disable @next/next/no-img-element */
"use client";

import { customer } from "@/types/customer";
import { ProductDetail } from "@/types/invoice";
import React, { FC } from "react";

type SocialMediaType = {
  facebook: string;
  tiktok: string;
};

interface ReceiptTemplateProps {
  selectedCustomer: customer | undefined;
  productList: ProductDetail[];
  discount: number;
  disInPercentage: number;
  grandTotal: number;
  dueDate: Date | null;
  invoiceNo: number;
  remainingBalance: number;
  return?: boolean;
  isRePrint: boolean;
  shopName?: string;
  shopTagline?: string;
  shopAddress?: string;
  shopPhone?: string;
  messageCustomer?: string;
  socialMedia?: SocialMediaType;
  logoUrl?: string;
  mode?: "retail" | "wholesale";
  isWholesale?: boolean;
  bookedBy?: string;
  paymentMethod?: string;
}

const ReceiptTemplate: FC<ReceiptTemplateProps> = ({
  productList = [],
  selectedCustomer,
  discount,
  disInPercentage,
  grandTotal,
  dueDate,
  invoiceNo,
  remainingBalance,
  isRePrint,
  shopName,
  shopTagline,
  shopAddress,
  shopPhone,
  messageCustomer,
  logoUrl,
  isWholesale = false,
  mode = "retail",
  bookedBy,
}) => {
  const renderWholesale = isWholesale || mode === "wholesale";

  // Calculations
  const returnItems = productList.filter((product) => product.return);
  const alreadyBoughtItems = productList.filter(
    (product) => product.sold && !product.return
  );
  const newItems = isRePrint
    ? []
    : productList.filter((product) => !product.sold && !product.return);

  const calcSubtotal = (items: ProductDetail[]) =>
    items.reduce(
      (total, product) => total + product.sellPrice * product.quantity,
      0
    );

  const newTotalAmount = calcSubtotal(newItems);
  const returnTotalAmount = calcSubtotal(returnItems);
  const alreadyBoughtTotalAmount = calcSubtotal(alreadyBoughtItems);

  const computedGrandTotal = isRePrint
    ? alreadyBoughtTotalAmount - returnTotalAmount - discount
    : newTotalAmount + alreadyBoughtTotalAmount - returnTotalAmount - discount;

  const displayGrandTotal = isRePrint ? computedGrandTotal : grandTotal;
  const formattedDate = new Date().toLocaleDateString("en-PK");
  const formattedTime = new Date().toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Default values pulled directly from retail section
  const finalShopName = shopName || "صدیق یونیفارم سنٹر";
  const finalShopTagline = shopTagline || "بہترین معیار، مناسب قیمت";
  const finalShopAddress = shopAddress || "پتہ:سراں مارکیٹ کریانوالہ";
  const finalShopPhone = shopPhone || "03086139401";

  // =========================================================
  // VIEW MODE 1: WHOLESALE INVOICE (CLEAN PRINT LAYOUT)
  // =========================================================
  if (renderWholesale) {
    return (
      <>
        <style jsx global>{`
          @media print {
            @page {
              size: A5 portrait;
              margin: 8mm;
            }
            body {
              background: #ffffff !important;
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <div
          style={{
            width: "148mm",
            minHeight: "210mm",
            fontFamily: "Arial, sans-serif",
            padding: "10mm",
            margin: "0 auto",
            color: "#000000",
            backgroundColor: "#ffffff",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            {/* TOP HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "bold" }}>Original</span>
            </div>

            {/* SHOP NAME & DETAILS */}
            <div style={{ textAlign: "center", marginBottom: "12px", borderBottom: "1px solid #000", paddingBottom: "6px" }}>
              <h1 style={{ margin: "0 0 2px 0", fontSize: "20px", fontWeight: "bold", direction: "rtl" }}>
                {finalShopName}
              </h1>
              <p style={{ margin: "0 0 4px 0", fontSize: "11px", fontStyle: "italic", direction: "rtl" }}>
                {finalShopTagline}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginTop: "4px" }}>
                <span style={{ direction: "rtl" }}>{finalShopAddress}</span>
                <span>WHATSAPP / TEL: {finalShopPhone}</span>
              </div>
            </div>

            {/* INVOICE & CUSTOMER INFO */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                fontSize: "11px",
                marginBottom: "10px",
                borderBottom: "1px solid #000",
                paddingBottom: "8px",
              }}
            >
              <div>
                <div style={{ margin: "2px 0" }}>
                  <strong>Customer:</strong> {selectedCustomer?.customerName || "Walk-in Customer"}
                </div>
                {selectedCustomer?.address && (
                  <div style={{ margin: "2px 0" }}>
                    <strong>Address:</strong> {selectedCustomer.address}
                  </div>
                )}
                {selectedCustomer?.phone && (
                  <div style={{ margin: "2px 0" }}>
                    <strong>Contact #:</strong> {selectedCustomer.phone}
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", fontWeight: "bold" }}>
                  Bill # {invoiceNo}
                </div>
                <div style={{ margin: "2px 0", fontSize: "10px" }}>
                  {formattedDate} {formattedTime}
                </div>
                {bookedBy && (
                  <div style={{ margin: "2px 0", fontSize: "10px" }}>
                    Sales Rep: {bookedBy}
                  </div>
                )}
              </div>
            </div>

            {/* PRODUCT TABLE */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "10px",
                marginBottom: "12px",
              }}
            >
              <thead>
                <tr style={{ borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
                  <th style={{ padding: "4px", textAlign: "center", width: "8%", borderRight: "1px solid #ccc" }}>Sr #</th>
                  <th style={{ padding: "4px", textAlign: "left", borderRight: "1px solid #ccc" }}>Description</th>
                  <th style={{ padding: "4px", textAlign: "center", width: "12%", borderRight: "1px solid #ccc" }}>Qty</th>
                  <th style={{ padding: "4px", textAlign: "right", width: "18%", borderRight: "1px solid #ccc" }}>Rate</th>
                  <th style={{ padding: "4px", textAlign: "right", width: "22%" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((product, idx) => (
                  <tr
                    key={`ws-item-${product.productName}-${idx}`}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td style={{ padding: "4px", textAlign: "center", borderRight: "1px solid #ccc" }}>{idx + 1}</td>
                    <td style={{ padding: "4px", borderRight: "1px solid #ccc" }}>
                      {product.productName}
                      {product.return && <span style={{ color: "red", marginLeft: "4px" }}>(RETURN)</span>}
                    </td>
                    <td style={{ padding: "4px", textAlign: "center", borderRight: "1px solid #ccc" }}>{product.quantity}</td>
                    <td style={{ padding: "4px", textAlign: "right", borderRight: "1px solid #ccc" }}>
                      {product.sellPrice.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      {(product.sellPrice * product.quantity).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTALS */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
              <table style={{ width: "45%", fontSize: "11px", borderCollapse: "collapse" }}>
                <tbody>
                  {discount > 0 && (
                    <tr>
                      <td style={{ padding: "3px 0" }}>Discount ({disInPercentage}%):</td>
                      <td style={{ padding: "3px 0", textAlign: "right" }}>
                        - {discount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: "1px solid #000", borderBottom: "2px solid #000", fontWeight: "bold" }}>
                    <td style={{ padding: "4px 0" }}>Grand Total:</td>
                    <td style={{ padding: "4px 0", textAlign: "right" }}>
                      Rs {displayGrandTotal.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  {remainingBalance !== 0 && (
                    <tr style={{ fontWeight: "bold" }}>
                      <td style={{ padding: "4px 0" }}>Balance Due:</td>
                      <td style={{ padding: "4px 0", textAlign: "right" }}>
                        Rs {remainingBalance.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* URDU FOOTER NOTE */}
          <div
            style={{
              borderTop: "1px solid #000",
              paddingTop: "6px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: "0 0 4px 0",
                fontSize: "12px",
                fontWeight: "bold",
                direction: "rtl",
                fontFamily: "Tahoma, Arial, sans-serif",
              }}
            >
              {messageCustomer || "نوٹ: خریدا ہوا مال واپس یا تبدیل نہیں ہوگا۔"}
            </p>
            <span style={{ fontSize: "9px", color: "#555" }}>Thank you for your business!</span>
          </div>
        </div>
      </>
    );
  }

  // ==========================================
  // VIEW MODE 2: RETAIL FORM (70mm THERMAL)
  // ==========================================
  const ThermalProductTable: FC<{ title: string; products: ProductDetail[] }> = ({
    title,
    products,
  }) => {
    if (!products.length) return null;
    return (
      <>
        {title && (
          <p
            style={{
              margin: "5px 0 2px 0",
              fontWeight: "bold",
              fontSize: "11px",
              color: "#111",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {`--- ${title} ---`}
          </p>
        )}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "10px",
            fontSize: "11px",
            fontFamily: "monospace",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "center", border: "1px solid #000", padding: "2px", fontWeight: "bold", width: "8%" }}>
                SR
              </th>
              <th style={{ textAlign: "left", border: "1px solid #000", padding: "2px", fontWeight: "bold" }}>
                Item
              </th>
              <th style={{ textAlign: "center", border: "1px solid #000", padding: "2px", fontWeight: "bold", width: "12%" }}>
                Qty
              </th>
              <th style={{ textAlign: "right", border: "1px solid #000", padding: "2px", fontWeight: "bold", width: "20%" }}>
                Rate
              </th>
              <th style={{ textAlign: "right", border: "1px solid #000", padding: "2px", fontWeight: "bold", width: "24%" }}>
                Amt
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <tr key={`rt-${product.productName}-${idx}`}>
                <td style={{ textAlign: "center", padding: "3px 2px", border: "1px solid #000" }}>
                  {idx + 1}
                </td>
                <td style={{ padding: "3px 2px", border: "1px solid #000" }}>
                  {product.productName}
                </td>
                <td style={{ textAlign: "center", padding: "3px 2px", border: "1px solid #000" }}>
                  {product.quantity}
                </td>
                <td style={{ textAlign: "right", padding: "3px 2px", border: "1px solid #000", whiteSpace: "nowrap" }}>
                  {product.sellPrice.toLocaleString("en-PK")}
                </td>
                <td style={{ textAlign: "right", padding: "3px 2px", border: "1px solid #000", whiteSpace: "nowrap" }}>
                  {(product.sellPrice * product.quantity).toLocaleString("en-PK")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  return (
    <div
      style={{
        width: "70mm",
        fontFamily: "monospace",
        padding: "4px",
        margin: "0 auto",
        color: "#000",
        backgroundColor: "#fff",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <h2
          style={{
            margin: "0 0 4px 0",
            fontSize: "18px",
            fontWeight: "bold",
            borderBottom: "2px solid black",
            paddingBottom: "4px",
          }}
        >
          {finalShopName}
        </h2>
        <p style={{ margin: "2px 0", fontStyle: "italic", fontSize: "10px" }}>
          {finalShopTagline}
        </p>
      </div>

      <div style={{ fontSize: "10px", textAlign: "center", marginBottom: "10px", lineHeight: "1.3" }}>
        <p style={{ margin: "1px 0" }}>{finalShopAddress}</p>
        <p style={{ margin: "1px 0" }}>فون نمبر: {finalShopPhone}</p>
      </div>

      <div style={{ fontSize: "10px", marginBottom: "8px" }}>
        <div style={{ border: "1px solid black", padding: "4px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: "bold" }}>Invoice:</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>#{invoiceNo}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold" }}>Date:</td>
                <td style={{ textAlign: "right" }}>{formattedDate} {formattedTime}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && selectedCustomer.type !== "wake-in-customer" && (
        <div style={{ fontSize: "10px", marginBottom: "6px", borderBottom: "1px dashed black", paddingBottom: "4px" }}>
          <p style={{ margin: "1px 0" }}>
            <strong>Customer:</strong> {selectedCustomer.customerName || "N/A"}
          </p>
          <p style={{ margin: "1px 0" }}>
            <strong>Type:</strong> {selectedCustomer.type || "N/A"}
          </p>
        </div>
      )}

      {returnItems.length > 0 && (
        <>
          <ThermalProductTable title="Return Items" products={returnItems} />
          <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px" }}>
            <tbody>
              <tr>
                <td>Return Sub-Total</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>
                  -Rs {returnTotalAmount.toLocaleString("en-PK")}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {alreadyBoughtItems.length > 0 && (
        <>
          <ThermalProductTable
            title={isRePrint ? "" : "Already Bought Items"}
            products={alreadyBoughtItems}
          />
          <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px" }}>
            <tbody>
              <tr>
                <td>Bought Sub-Total</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>
                  Rs {alreadyBoughtTotalAmount.toLocaleString("en-PK")}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {newItems.length > 0 && (
        <>
          <ThermalProductTable
            title={returnItems.length > 0 || alreadyBoughtItems.length > 0 ? "New Items" : ""}
            products={newItems}
          />
          <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px" }}>
            <tbody>
              <tr>
                <td>New Sub-Total</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>
                  Rs {newTotalAmount.toLocaleString("en-PK")}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <table
        style={{
          width: "100%",
          fontSize: "11px",
          borderTop: "1px dotted black",
          paddingTop: "4px",
          marginTop: "6px",
        }}
      >
        <tbody>
          {discount > 0 && (
            <tr>
              <td>Discount ({disInPercentage}%)</td>
              <td style={{ textAlign: "right" }}>
                Rs {discount.toLocaleString("en-PK")}
              </td>
            </tr>
          )}
          <tr style={{ fontWeight: "bold" }}>
            <td style={{ paddingTop: "2px" }}>Grand Total</td>
            <td style={{ textAlign: "right", paddingTop: "2px" }}>
              Rs {displayGrandTotal.toLocaleString("en-PK")}
            </td>
          </tr>
          {remainingBalance !== 0 && (
            <tr style={{ fontWeight: "bold" }}>
              <td>Ledger Balance</td>
              <td style={{ textAlign: "right" }}>
                Rs {remainingBalance.toLocaleString("en-PK")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReceiptTemplate;