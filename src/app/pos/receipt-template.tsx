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

// ===================== Shared helpers (defined outside so React never remounts them) =====================

const exactColors = {
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
} as React.CSSProperties;

const fmt2 = (n: number) =>
  Math.abs(n).toLocaleString("en-PK", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Math.abs(n).toLocaleString("en-PK");

const urduFontFamily =
  '"Nafees Nastaleeq", "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", serif';

const DEFAULT_NOTE = "نوٹ: خریدا ہوا مال واپس یا تبدیل نہیں ہوگا۔";

// Black bar for returns (prints on B&W), outlined bar for normal sections
const SectionBar: FC<{ label: string; inverted?: boolean }> = ({ label, inverted }) => (
  <div
    style={{
      margin: "8px 0 3px",
      padding: "2px 0",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: "11px",
      letterSpacing: "1px",
      textTransform: "uppercase",
      ...(inverted
        ? { background: "#000", color: "#fff", ...exactColors }
        : { borderTop: "1px solid #000", borderBottom: "1px solid #000" }),
    }}
  >
    {label}
  </div>
);

// ---------- Retail (70mm thermal) table ----------
const ThermalProductTable: FC<{
  title?: string;
  products: any[];
  negative?: boolean;
  subtotalLabel?: string;
  subtotal?: number;
}> = ({ title, products, negative = false, subtotalLabel, subtotal }) => {
  if (!products.length) return null;
  const cell = { border: "1px solid #000", padding: "3px 2px" } as const;
  return (
    <>
      {title && <SectionBar label={title} inverted={negative} />}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "6px",
          fontSize: "11px",
          fontFamily: "monospace",
        }}
      >
        <thead>
          <tr>
            <th style={{ ...cell, textAlign: "center", width: "8%" }}>SR</th>
            <th style={{ ...cell, textAlign: "left" }}>Item</th>
            <th style={{ ...cell, textAlign: "center", width: "12%" }}>Qty</th>
            <th style={{ ...cell, textAlign: "right", width: "20%" }}>Rate</th>
            <th style={{ ...cell, textAlign: "right", width: "24%" }}>Amt</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, idx) => (
            <tr key={`rt-${p.productName}-${idx}`}>
              <td style={{ ...cell, textAlign: "center" }}>{idx + 1}</td>
              <td style={cell}>
                {p.productName}
                {negative && p.returnReason && (
                  <div style={{ fontSize: "9px" }}>Reason: {p.returnReason}</div>
                )}
              </td>
              <td style={{ ...cell, textAlign: "center" }}>
                {negative ? `-${p.quantity}` : p.quantity}
              </td>
              <td style={{ ...cell, textAlign: "right", whiteSpace: "nowrap" }}>
                {fmt0(p.sellPrice)}
              </td>
              <td style={{ ...cell, textAlign: "right", whiteSpace: "nowrap" }}>
                {negative ? "-" : ""}
                {fmt0(p.sellPrice * p.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
        {subtotalLabel !== undefined && subtotal !== undefined && (
          <tfoot>
            <tr style={{ fontWeight: "bold" }}>
              <td colSpan={4} style={{ ...cell, textAlign: "right" }}>
                {subtotalLabel}
              </td>
              <td style={{ ...cell, textAlign: "right", whiteSpace: "nowrap" }}>
                {negative ? "-" : ""}
                {fmt0(subtotal)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </>
  );
};

// ---------- Wholesale (A5) table section ----------
const WholesaleSection: FC<{
  title?: string;
  rows: any[];
  negative?: boolean;
  subtotalLabel?: string;
  subtotal?: number;
}> = ({ title, rows, negative = false, subtotalLabel, subtotal }) => {
  if (!rows.length) return null;
  const td = { padding: "4px", borderRight: "1px solid #ccc" } as const;
  return (
    <>
      {title && (
        <tr>
          <td
            colSpan={5}
            style={{
              padding: "4px",
              textAlign: "center",
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
              background: negative ? "#000" : "#eee",
              color: negative ? "#fff" : "#000",
              ...exactColors,
            }}
          >
            {title}
          </td>
        </tr>
      )}
      {rows.map((p, idx) => (
        <tr
          key={`ws-${title ?? "items"}-${p.productName}-${idx}`}
          style={{ borderBottom: "1px solid #eee" }}
        >
          <td style={{ ...td, textAlign: "center" }}>{idx + 1}</td>
          <td style={td}>
            {p.productName}
            {negative && p.returnReason && (
              <div style={{ fontSize: "9px" }}>Reason: {p.returnReason}</div>
            )}
          </td>
          <td style={{ ...td, textAlign: "center" }}>
            {negative ? `-${p.quantity}` : p.quantity}
          </td>
          <td style={{ ...td, textAlign: "right" }}>{fmt2(p.sellPrice)}</td>
          <td style={{ padding: "4px", textAlign: "right" }}>
            {negative ? "-" : ""}
            {fmt2(p.sellPrice * p.quantity)}
          </td>
        </tr>
      ))}
      {subtotalLabel !== undefined && subtotal !== undefined && (
        <tr style={{ fontWeight: "bold", borderTop: "1px solid #000" }}>
          <td colSpan={4} style={{ padding: "4px", textAlign: "right" }}>
            {subtotalLabel}
          </td>
          <td style={{ padding: "4px", textAlign: "right" }}>
            {negative ? "-" : ""}
            {fmt2(subtotal)}
          </td>
        </tr>
      )}
    </>
  );
};

// ===================== Main component =====================

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
  const summary = summarizeInvoice({ items: productList, discount });
  // Sold list shows only real sales; returns appear only in their own section
  const saleRows = summary.saleRows.filter((r: any) => resolveMode(r) !== "return");
  const { returnRows } = summary;
  const displayGrandTotal = summary.grandTotal;
  const hasReturns = returnRows.length > 0;
  const isRefund = displayGrandTotal < 0;

  const returnNotes = hasReturns ? (
    <div style={{ fontSize: "10px", margin: "4px 0" }}>
      {returnRows.map((row: any, i: number) => (
        <div key={`return-note-${i}`}>
          Returned on {formatReturnTime(row.at)}: {row.quantity} pcs
        </div>
      ))}
    </div>
  ) : null;

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
                <div style={{ fontSize: "13px", fontWeight: "bold" }}>Bill # {invoiceNo}</div>
                <div style={{ margin: "2px 0", fontSize: "10px" }}>
                  <ReceiptDateTime />
                </div>
                {bookedBy && (
                  <div style={{ margin: "2px 0", fontSize: "10px" }}>Sales Rep: {bookedBy}</div>
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
                <WholesaleSection
                  title={hasReturns ? "Items Purchased" : undefined}
                  rows={saleRows}
                  subtotalLabel={hasReturns ? "Sold Sub-Total" : undefined}
                  subtotal={summary.soldTotal}
                />
                <WholesaleSection
                  title="Items Returned"
                  rows={returnRows}
                  negative
                  subtotalLabel="Returns Credit"
                  subtotal={summary.refundedAmount}
                />
              </tbody>
            </table>
            {returnNotes}

            {/* TOTALS */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
              <table style={{ width: "45%", fontSize: "11px", borderCollapse: "collapse" }}>
                <tbody>
                  {discount > 0 && (
                    <tr>
                      <td style={{ padding: "3px 0" }}>Discount ({disInPercentage}%):</td>
                      <td style={{ padding: "3px 0", textAlign: "right" }}>- {fmt2(discount)}</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: "1px solid #000", borderBottom: "2px solid #000", fontWeight: "bold" }}>
                    <td style={{ padding: "4px 0" }}>{isRefund ? "REFUND DUE:" : "Grand Total:"}</td>
                    <td style={{ padding: "4px 0", textAlign: "right" }}>Rs {fmt2(displayGrandTotal)}</td>
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
          <div style={{ borderTop: "1px solid #000", paddingTop: "6px", textAlign: "center" }}>
            <p
              style={{
                margin: "0 0 4px 0",
                fontSize: "14px",
                fontWeight: "bold",
                direction: "rtl",
                fontFamily: urduFontFamily,
              }}
            >
              {messageCustomer || DEFAULT_NOTE}
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

        <div
          style={{
            fontSize: "11px",
            textAlign: "center",
            marginBottom: "10px",
            lineHeight: "1.4",
            fontFamily: urduFontFamily,
            direction: "rtl",
          }}
        >
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
                  <td style={{ textAlign: "right" }}>
                    <ReceiptDateTime />
                  </td>
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

        <ThermalProductTable
          title={hasReturns ? "Sold Items" : undefined}
          products={saleRows}
          subtotalLabel={hasReturns ? "Sold Sub-Total" : undefined}
          subtotal={summary.soldTotal}
        />

        {hasReturns && (
          <>
            <ThermalProductTable
              title="Returned Items"
              products={returnRows}
              negative
              subtotalLabel="Returns Credit"
              subtotal={summary.refundedAmount}
            />
            {returnNotes}
          </>
        )}

        <table style={{ width: "100%", fontSize: "11px", borderTop: "2px solid #000", marginTop: "6px" }}>
          <tbody>
            {discount > 0 && (
              <tr>
                <td>Discount ({disInPercentage}%)</td>
                <td style={{ textAlign: "right" }}>-Rs {fmt0(discount)}</td>
              </tr>
            )}
            <tr style={{ fontWeight: "bold", fontSize: "13px" }}>
              <td style={{ paddingTop: "3px" }}>{isRefund ? "REFUND DUE" : "Net Total"}</td>
              <td style={{ textAlign: "right", paddingTop: "3px", whiteSpace: "nowrap" }}>
                Rs {fmt0(displayGrandTotal)}
              </td>
            </tr>
            {remainingBalance !== 0 && (
              <tr style={{ fontWeight: "bold" }}>
                <td>Ledger Balance</td>
                <td style={{ textAlign: "right" }}>Rs {remainingBalance.toLocaleString("en-PK")}</td>
              </tr>
            )}
            {dueDate && (
              <tr style={{ fontWeight: "bold" }}>
                <td>Due Date:</td>
                <td style={{ textAlign: "right" }}>
                  {new Date(dueDate).toLocaleDateString("en-PK")}
                </td>
              </tr>
            )}
            <tr>
              <td
                colSpan={2}
                style={{
                  textAlign: "center",
                  paddingTop: "6px",
                  fontSize: "10px",
                  fontFamily: urduFontFamily,
                  direction: "rtl",
                }}
              >
                {messageCustomer || DEFAULT_NOTE}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ReceiptTemplate;