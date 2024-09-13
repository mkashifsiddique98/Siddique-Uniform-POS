import React from "react";

const PayNowChart = () => {
  const productList = [
    {
      productName: "Men's T-shirt",
      quantity: 2,
      sellPrice: 500,
    },
    {
      productName: "Women's Jeans",
      quantity: 1,
      sellPrice: 1200,
    },
    {
      productName: "Kids Shoes",
      quantity: 3,
      sellPrice: 700,
    },
  ];
  const discount = 200;
  const grandTotal = 3300;
  const disInPercentage = 5;

  const handlePrint = async () => {
    try {
      const response = await fetch("/api/print", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productList,
          discount,
          grandTotal,
          disInPercentage,
        }),
      });

      if (response.ok) {
        console.log("Receipt sent to printer successfully");
      } else {
        console.error("Failed to send receipt to printer");
      }
    } catch (error) {
      console.error("Error sending print request:", error);
    }
  };

  return <button onClick={handlePrint}>Print Receipt</button>;
};

export default PayNowChart;
