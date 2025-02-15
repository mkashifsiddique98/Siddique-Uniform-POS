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
  return:boolean
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
  const returnTotalAmount = productList
  .filter((product) => product.return)
  .reduce(
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
              margin: "0px 0 3px 0",
              fontSize: "22px",
              fontFamily: "fantasy",
              fontWeight: "bold",
              borderBottom: "2px solid black",
              paddingBottom: "1px",
            }}
          >
            Siddique Uniform Centre
          </h2>
        </div>
        <p className="capitalize text-center italic text-xs mb-2">high Quality and low price</p>
        <p className="flex justify-start items-center text-xs gap-1">
        <MapPinIcon size={10} /><Store size={10} />Address: Saran Market Karianwala
        </p>
        <p className="flex justify-start items-center gap-1"><Phone size={10} /><Smartphone size={10} /><span>Phone: 03086139401</span> </p>

        {/* Receipt Information */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width:"100%",
            border: "1px solid black",
            padding: "2px",
            margin: "8px 0",
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
          <div className="flex items-center my-2">
            <p className="font-bold">
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
     {/* Whole Product List */}
    {productList.filter((product) => product.return).length >= 1 && <>
   
      {/* Return Product Table */}
       <p className="leading-2 font-bold">Return Items</p> 
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
            {productList
            .filter((product) => product.return)
            .map((product) => (
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "5px 0",
          }}
        >
          <span>Sub-Total</span>
          <span>-Rs {returnTotalAmount}</span>
        </div>
        {/*New Product Table */}
        <p className="leading-2 font-bold">New Items</p>
        </>
}
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
        {/* Bar code */}
        {/* <div className="flex justify-center items-center py-2" style={{ borderTop: "1px dotted black", borderBottom: "1px dotted black" }}>
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
        <div className="flex justify-around items-center" style={{ textAlign: "center", marginBottom: "10px" }}>
        <Facebook size={15} />
          <QRCode
            value={"https://www.facebook.com/Siddiqueuniformcentre/"}
            size={60}
          />
          <div>
          <p>|</p>
          <p>|</p>
          <p>|</p>
          <p>|</p>
          </div>
          
          <Image src={"/icon/tiktok.png"} width={12} height={15} alt="tiktok" />
          <QRCode
            value={"https://www.tiktok.com/@siddique.uniform"}
            size={60}
          />
        </div> */}
        {/* Footer */}
        <div>
        <p
          style={{
            textAlign: "center",
            margin: "12px 0 10px 0",
            fontSize: "14px",
            fontFamily:"Noto Nastaliq Urdu",
          }}
        >
        نوٹ: خریدا ہوا سامان بل کے بغیر واپس یا تبدیل نہیں ہوگا۔  </p>
        </div>
      </div>
      );
};

      export default ReceiptTemplate;
