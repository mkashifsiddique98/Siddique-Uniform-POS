import { customer } from "@/types/customer";
import { ProductDetail } from "@/types/invoice";
import { Facebook, MapPinIcon, Phone, Smartphone, Store } from "lucide-react";
import QRCode from "react-qr-code";
import React, { FC } from "react";
import Barcode from "react-barcode"
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
interface ReceiptTemplateProps {
  selectedCustomer: customer | undefined;
  productList: ProductDetail[];
  discount: number;
  disInPercentage: number;
  grandTotal: number;
  dueDate: Date | null;
  invoiceNo: number;
  remainingBalance: number;
}

const ReceiptTemplate: FC<ReceiptTemplateProps> = ({
  productList,
  selectedCustomer,
  discount,
  disInPercentage,
  grandTotal,
  dueDate,
  invoiceNo,
  remainingBalance,
}) => {
  const totalAmount = productList.reduce(
    (total, product) => total + product.sellPrice * product.quantity,
    0
  );

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
      
        <div className="flex justify-center items-center relative">
          <h2
            style={{
              margin: "5px 0 3px 0",
              fontSize: "18px",
              fontFamily: "fantasy",
              fontWeight: "bold",
              borderBottom: "2px solid black",
              paddingBottom: "1px",
            }}
          >
            Siddique Uniform Centre
          </h2>
          <div className="absolute top-1 right-0 rotate-45">
            <Image
              src="/icon/siddique-uniform-center.png"
              alt="siddique"
              height={30}
              width={30}
            />
          </div>
        </div>
        <p className="capitalize text-center italic text-xs mb-2">high Quality and low price</p>
        <p className="flex justify-center items-center text-xs gap-1">
        <MapPinIcon size={10} /><Store size={10} />Address: Saran Market Karianwala
        </p>
        <p className="flex justify-center items-center gap-1"><Phone size={10} /><Smartphone size={10} /><span>Phone: 03086139401</span> </p>

        {/* Receipt Information */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            border: "1px solid black",
            padding: "5px",
            margin: "10px 0",
            borderRadius: "3px",
            alignItems: "center",
          }}
        >
          <p style={{ margin: "0", fontWeight: "bold" }}>Receipt No: <span style={{ margin: "0", fontWeight: "normal" }}>{invoiceNo}</span></p>
          <p style={{ margin: "0" }}>
           <span style={{ fontWeight: "bold" }}> Date:</span> {new Date().toLocaleDateString("en-PK")} <br />
           <span style={{ fontWeight: "bold" }}>Time:</span>  {new Date().toLocaleTimeString("en-PK", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>


        {/* Customer Info */}
        {selectedCustomer?.type === "wake-in-customer" ? (
          <div className="flex justify-center items-center">
            <p style={{ margin: "5px 0", fontWeight: "bold" }}>
              Name: Regular Customer
            </p>
          </div>
        ) : (
          <>
            <p style={{ margin: "5px 0", fontWeight: "bold" }}>
              Customer Name: {selectedCustomer?.customerName || "N/A"}
            </p>
            <p style={{ margin: "5px 0", fontWeight: "bold" }}>
              Customer Type: {selectedCustomer?.type || "N/A"}
            </p>
          </>
        )}



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
              <th style={{ textAlign: "center", border: "1px solid black",fontWeight:"bold" }}>
                Product
              </th>
              <th style={{ textAlign: "center", border: "1px solid black",fontWeight:"bold" }}>
                Qty
              </th>
              <th style={{ textAlign: "center", border: "1px solid black",fontWeight:"bold" }}>
                Price
              </th>
              <th style={{ textAlign: "center", border: "1px solid black",fontWeight:"bold" }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {productList.map((product) => (
              <tr key={product.productName}>
                <td style={{ padding: "5px 0 5px 3px", border: "1px solid black" }}>{product.productName}</td>
                <td style={{ textAlign: "center", padding: "5px 0", border: "1px solid black" }}>
                  {product.quantity}
                </td>
                <td style={{ textAlign: "right", padding: "5px 3px", border: "1px solid black", whiteSpace: "nowrap" }}>
                  {product.sellPrice}
                </td>
                <td style={{ textAlign: "right", padding: "5px 3px", border: "1px solid black", whiteSpace: "nowrap" }}>
                  {product.sellPrice * product.quantity}
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
          }}
        >
          <span>Sub-Total</span>
          <span>Rs {totalAmount}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "5px 0",
            borderTop: "1px dotted black",
          }}
        >
          <span>Discount</span>
          <span>
            Rs {discount} ({disInPercentage}%)
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "5px 0",
            borderTop: "1px dotted black",
            fontWeight: "bold",
          }}
        >
          <span>Grand Total</span>
          <span>Rs {grandTotal}</span>
        </div>

        {/* Remaining Balance */}
        {remainingBalance !== 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
              borderTop: "1px dotted black",
              fontWeight: "bold",
            }}
          >
            <span>Remaining Balance</span>
            <span>Rs {remainingBalance}</span>
          </div>
        )}

        {/* Due Date for Special Stitching */}
        {selectedCustomer?.type === "special-stitching" && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
              borderTop: "1px dotted black",
              fontWeight: "bold",
            }}
          >
            <span>Due Date for Stitching</span>
            <span>{dueDate ? new Date(dueDate).toLocaleDateString() : "N/A"}</span>
          </div>
        )}
        <div className="flex justify-center items-center py-2" style={{ borderTop: "1px dotted black", borderBottom: "1px dotted black" }}>
          <Barcode
            margin={0}
            height={25}
            displayValue={false}
            value={invoiceNo.toString()}
          />
        </div>
        <div className="flex justify-center items-center gap-0 my-2">
          <span className="capitalize text-base">Follow us Social Media</span>
        </div>
        <div className="flex justify-between items-center" style={{ textAlign: "center", marginBottom: "10px" }}>
        <Facebook size={15} />
          <QRCode
            value={"https://www.facebook.com/Siddiqueuniformcentre/"}
            size={80}
          />
          <div>
          <p>|</p>
          <p>|</p>
          <p>|</p>
          <p>|</p>
          </div>
          
          <Image src={"/icon/tiktok.png"} width={15} height={15} alt="tiktok" />
          <QRCode
            value={"https://www.facebook.com/Siddiqueuniformcentre/"}
            size={80}
          />
        </div>
        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            margin: "10px 0",
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
