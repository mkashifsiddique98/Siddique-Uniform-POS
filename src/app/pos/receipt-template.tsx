/* eslint-disable @next/next/no-img-element */
"use client";

import { customer } from "@/types/customer";
import { ProductDetail } from "@/types/invoice";
import React, { FC } from "react";
import { resolveMode, summarizeInvoice } from "@/lib/posHelpers";
import ReceiptDateTime from "./ReceiptDateTime";
import { formatReturnTime } from "@/lib/formatTime";

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
  dueDate,
  invoiceNo,
  remainingBalance,
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

  // Same helper as save, view page and list, so every screen and the print show the same numbers
  const isReturnItem = (product: ProductDetail) => resolveMode(product) === "return";
  const summary = summarizeInvoice({ items: productList, discount });
  const { saleRows, returnRows } = summary;
  const displayGrandTotal = summary.grandTotal;
  const hasReturns = returnRows.length > 0;
  const returnNotes = hasReturns ? (
    <div style={{ fontSize: "10px", margin: "4px 0" }}>
      {returnRows.map((row: any, i: number) => (
        <div key={`return-note-${i}`}>
          Returned on {formatReturnTime(row.at)}: {row.quantity} pcs
        </div>
      ))}
    </div>
  ) : null;
  const money = (value: number) => value.toLocaleString("en-PK");

  // Default values pulled directly from retail section
  const finalShopName = shopName || "صدیق یونیفارم سنٹر";
  const finalShopTagline = shopTagline || "بہترین معیار، مناسب قیمت";
  const finalShopAddress = shopAddress || "پتہ:سراں مارکیٹ کریانوالہ";
  const finalShopPhone = shopPhone || "03086139401";

  // Shared Urdu Nastaleeq font stack
  const urduFontFamily = '"Nafees Nastaleeq", "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", serif';

  // =========================================================
  // VIEW MODE 1: WHOLESALE INVOICE (CLEAN PRINT LAYOUT)
  // =========================================================
  if (renderWholesale) {
    return (
      <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');

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
              <h1 style={{ margin: "0 0 2px 0", fontSize: "22px", fontWeight: "bold", direction: "rtl", fontFamily: urduFontFamily }}>
                {finalShopName}
              </h1>
              <p style={{ margin: "0 0 4px 0", fontSize: "13px", direction: "rtl", fontFamily: urduFontFamily }}>
                {finalShopTagline}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginTop: "4px" }}>
                <span style={{ direction: "rtl", fontFamily: urduFontFamily }}>{finalShopAddress}</span>
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
                  <ReceiptDateTime />
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
                {saleRows.concat(returnRows as any).map((product: any, idx) => (
                  <tr
                    key={`ws-item-${product.productName}-${idx}`}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td style={{ padding: "4px", textAlign: "center", borderRight: "1px solid #ccc" }}>{idx + 1}</td>
                    <td style={{ padding: "4px", borderRight: "1px solid #ccc" }}>
                      {product.productName}
                      {isReturnItem(product) && <span style={{ color: "red", marginLeft: "4px" }}>(RETURN)</span>}
                      {!isReturnItem(product) && product.returnedQty > 0 && (
                        <span style={{ marginLeft: "4px", fontSize: "9px" }}>
                          (Sold {product.soldQty}, Returned {product.returnedQty}, Net {product.netQty})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "4px", textAlign: "center", borderRight: "1px solid #ccc" }}>
                      {isReturnItem(product) ? `-${product.quantity}` : product.quantity}
                    </td>
                    <td style={{ padding: "4px", textAlign: "right", borderRight: "1px solid #ccc" }}>
                      {product.sellPrice.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      {isReturnItem(product) ? "-" : ""}
                      {(product.sellPrice * product.quantity).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {returnNotes}

            {/* TOTALS */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
              <table style={{ width: "45%", fontSize: "11px", borderCollapse: "collapse" }}>
                <tbody>
                  {hasReturns && (
                    <tr>
                      <td style={{ padding: "3px 0" }}>Refunded:</td>
                      <td style={{ padding: "3px 0", textAlign: "right" }}>
                        - {summary.refundedAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
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

                  {dueDate && (
                    <tr>
                      <td style={{ fontWeight: "bold" }}>Due Date:</td>
                      <td style={{ textAlign: "right" }}>
                        {new Date(dueDate).toLocaleDateString("en-PK")}
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
                fontSize: "14px",
                fontWeight: "bold",
                direction: "rtl",
                fontFamily: urduFontFamily,
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
  const ThermalProductTable: FC<{ title: string; products: any[]; negative?: boolean }> = ({
    title,
    products,
    negative = false,
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
                  {!negative && product.returnedQty > 0 && (
                    <div style={{ fontSize: "9px" }}>
                      Sold {product.soldQty} | Returned {product.returnedQty} | Net {product.netQty}
                    </div>
                  )}
                  {negative && product.returnReason && (
                    <div style={{ fontSize: "9px" }}>{product.returnReason}</div>
                  )}
                </td>
                <td style={{ textAlign: "center", padding: "3px 2px", border: "1px solid #000" }}>
                  {negative ? `-${product.quantity}` : product.quantity}
                </td>
                <td style={{ textAlign: "right", padding: "3px 2px", border: "1px solid #000", whiteSpace: "nowrap" }}>
                  {product.sellPrice.toLocaleString("en-PK")}
                </td>
                <td style={{ textAlign: "right", padding: "3px 2px", border: "1px solid #000", whiteSpace: "nowrap" }}>
                  {negative ? "-" : ""}
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
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
      `}</style>
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
              fontSize: "20px",
              fontWeight: "bold",
              borderBottom: "2px solid black",
              paddingBottom: "4px",
              fontFamily: urduFontFamily,
              direction: "rtl",
            }}
          >
            {finalShopName}
          </h2>
          <p style={{ margin: "2px 0", fontSize: "12px", fontFamily: urduFontFamily, direction: "rtl" }}>
            {finalShopTagline}
          </p>
        </div>

        <div style={{ fontSize: "11px", textAlign: "center", marginBottom: "10px", lineHeight: "1.4", fontFamily: urduFontFamily, direction: "rtl" }}>
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
                  <td style={{ textAlign: "right" }}><ReceiptDateTime /></td>
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

        <ThermalProductTable title={hasReturns ? "Sold Items" : ""} products={saleRows} />
        {hasReturns && (
          <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px" }}>
            <tbody>
              <tr>
                <td>Sold Sub-Total</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>Rs {money(summary.soldTotal)}</td>
              </tr>
            </tbody>
          </table>
        )}

        {hasReturns && (
          <>
            <ThermalProductTable title="Returned Items" products={returnRows} negative />
            <table style={{ width: "100%", fontSize: "11px", marginBottom: "4px" }}>
              <tbody>
                <tr>
                  <td>Refunded</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    -Rs {money(summary.refundedAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
            {returnNotes}
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
                  -Rs {discount.toLocaleString("en-PK")}
                </td>
              </tr>
            )}
            <tr style={{ fontWeight: "bold" }}>
              <td style={{ paddingTop: "2px" }}>Net Total</td>
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

            {dueDate && (
              <tr className="due-date-row" style={{ fontWeight: "bold", borderTop: "1px dotted black", paddingTop: "4px" }}>
                <td style={{ fontWeight: "bold" }}>Due Date:</td>
                <td style={{ textAlign: "right" }}>
                  {new Date(dueDate).toLocaleDateString("en-PK")}
                </td>
              </tr>
            )}

            <tr>
              <td colSpan={2} style={{ textAlign: "center", paddingTop: "6px", fontSize: "10px", fontFamily: urduFontFamily, direction: "rtl" }}>
                {messageCustomer || "نوٹ: خریدا ہوا مال واپس یا تبدیل نہیں ہوگا۔"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ReceiptTemplate;