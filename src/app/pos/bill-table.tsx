import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BadgePlus,
  FilePenLine,
  MinusSquare,
  PlusSquare,
  RotateCcw,
  XCircle,
} from "lucide-react";
import React, { FC, useEffect, useState } from "react";
import PayNowChart from "./pay-now";
import { Label } from "@/components/ui/label";
import {
  Products,
  clearChart,
  removeItemChart,
  setDiscount,
  setInvoiceNumber,
  updateChart,
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";
import { calculatePercentage } from "@/utils";
import { customer } from "@/types/customer";
import { handleGenerateNewInvoiceNumber } from "./usePos";

interface BillTableProps {
  selectedCustomer?: customer;
  handleEditInvoice: () => void;
  editInvoice: boolean;
  errorMessage: string;
}

const BillTable: FC<BillTableProps> = ({
  selectedCustomer,
  handleEditInvoice,
  editInvoice,
  errorMessage
}) => {
  // Local State
  const [specialProductName, setSpecialProductName] = useState("");
  const [specialProductPrice, setSpecialProductPrice] = useState<number | "">("");
  const [specialProductQty, setSpecialProductQty] = useState<number | "">("");

  // Redux State
  const dispatch = useAppDispatch();
  const chartList: Products[] = useTypedSelector((state) => state.chart.chartList);
  const discount: number = useTypedSelector((state) => state.invoice.discount);
  const invoiceNo: number = useTypedSelector(
    (state) => state.invoice.invoiceNumber
  );
  const mode = useTypedSelector((state) => state.mode); // mode
  let grandTotal = chartList.reduce((total, product) => {
    let lineTotal = product.quantity * product.sellPrice;
    return total + lineTotal;
  }, 0);
  let disInPrecentage = calculatePercentage(discount, grandTotal);
  grandTotal = grandTotal - (discount ? discount : 0);
  
// Effect for Invoice Number 
  // Helping Function or Clear Button 
  const handleReset = () => {
    if (editInvoice) handleEditInvoice();
    dispatch(clearChart());
    dispatch(setDiscount(0));
    grandTotal = 0;
    // For Accuracy of Invoice Number
    const storedValue = Number(localStorage.getItem('invoiceNo')) || 0;
    const newInvoiceNumber = Math.max(storedValue, invoiceNo);
    dispatch(setInvoiceNumber(newInvoiceNumber));
  };
  // Function Update chart
  const handleUpdate = (productName: string, quantity: number) => {
    if (!isNaN(quantity)) {
      dispatch(
        updateChart({
          productName: productName,
          quantity: quantity,
        })
      );
    } else {
      // Handle the case where quantity is NaN
      console.error("Invalid quantity:", quantity);
    }
    // dispatch(updateChart({ productName: productName, quantity: quantity }));
  };
  // Function Remove item from chart
  const handleRemoveItem = (productName: string) => {
    dispatch(removeItemChart({ productName }));
  };
  // *************************************for Special stiching Customer ***********
  const handleAddSpecialProduct = () => {
    if (specialProductName && specialProductPrice && specialProductQty) {
      const newProduct: Products = {
        productName: specialProductName,
        sellPrice: specialProductPrice,
        quantity: specialProductQty,
        category: "special", // or another default category if needed
        size: "N/A", // handle size or set to default if not applicable
        productCost: 0, // you may want to adjust this based on your logic
        stockAlert: 0, // if you need to track this for special stitching
        productId: Object,
        schoolName: "special",
        wholesalePrice: 0,
      };
      dispatch(updateChart(newProduct));
      // Reset special product inputs after adding
      setSpecialProductName("");
      setSpecialProductPrice("");
      setSpecialProductQty("");
    } else {
      console.error("All fields must be filled");
    }
  };
  // ================================ Save Changes in invoice (While Edit invoice)================
  const saveChangeInvoice = async () => {
    // incase if some try to save empty invoice
    if (chartList.length === 0) {
      handleReset();
      return;
    }
    const invoiceDetail = {
      customer: selectedCustomer,
      productDetail: chartList,
      discount,
      grandTotal,
      invoiceNo,
      dueDate: null,
      anyMessage: "",
      prevBalance: 0,
    };

    try {
      const response = await fetch("/api/invoice/", {
        method: "POST",
        body: JSON.stringify(invoiceDetail),
      });
      if (response.ok) handleReset();
    } catch (error) {
      console.error("Server Error", error);
    }
  };
  return (
    <div className="flex flex-col justify-between h-[75vh]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] text-left font-semibold">
              Product
            </TableHead>
            <TableHead className="text-right font-semibold">Price</TableHead>
            <TableHead className="text-center font-semibold">
              Quantity
            </TableHead>
            <TableHead className="text-center font-semibold">
              Line Total
            </TableHead>
            <TableHead className="text-center font-semibold">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {chartList.map((product, index) => (
            <TableRow key={index + product.productName}>
              <TableCell>{product.productName}</TableCell>
              <TableCell className="text-right">{product.sellPrice}</TableCell>
              <TableCell className="text-center">
                <div className="flex justify-evenly items-center">
                  <button onClick={() => handleUpdate(product.productName, -1)}>
                    <MinusSquare />
                  </button>
                  <input className="w-6" value={product.quantity} />
                  <button onClick={() => handleUpdate(product.productName, 1)}>
                    <PlusSquare />
                  </button>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {product.quantity * product.sellPrice}
              </TableCell>
              <TableCell className="text-center">
                <span
                  className="cursor-pointer text-center"
                  onClick={() => handleRemoveItem(product.productName)}
                >
                  <XCircle className="text-red-500" />
                </span>
              </TableCell>
            </TableRow>
          ))}

          {/* Special Stitching Product Input */}
          {selectedCustomer?.type === "special-sitching" && (
            <TableRow>
              <TableCell colSpan={2}>
                <Input
                  placeholder="Product Name"
                  style={{ minWidth: "250px" }}
                  value={specialProductName} // state for the special product name
                  onChange={(e) => setSpecialProductName(e.target.value)}
                />
              </TableCell>

              <TableCell className="text-right">
                <Input
                  placeholder="Qty"
                  type="number"
                  value={specialProductQty} // state for the special product quantity
                  onChange={(e) =>
                    setSpecialProductQty(parseInt(e.target.value, 10))
                  }
                />
              </TableCell>
              <TableCell className="text-right">
                <Input
                  placeholder="Sell Price"
                  style={{ minWidth: "100px" }}
                  type="number"
                  value={specialProductPrice} // state for the special product price
                  onChange={(e) =>
                    setSpecialProductPrice(parseFloat(e.target.value))
                  }
                />
              </TableCell>
              <TableCell className="text-center">
                <Button onClick={handleAddSpecialProduct} size={"sm"}>
                  <BadgePlus />
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {chartList.length === 0 && (
        <div className="relative  mt-1 text-center text-white capitalize bg-gray-400 text-lg w-full p-2 animate-pulse">
          Empty Product List
        </div>
      )}

      <div>
        <div className="w-full bg-black p-2 text-center text-white">
          <p className="font-semibold">
            Grand Total : Rs {grandTotal ? grandTotal : "0.00"}
          </p>
        </div>
       
        <div className="flex justify-end mr-16 mt-2 -mb-2">
          <Label htmlFor="discount">Discount</Label>
        </div>
         
        <div className="flex justify-end mt-3 relative">
          
          <Input
            id="discount"
            placeholder="discount"
            type="number"
            min={0}
            disabled={chartList.length <= 0}
            value={discount}
            onChange={(e) =>
              dispatch(setDiscount(Math.max(0, parseInt(e.target.value, 10))))
            }
            className="w-32 rounded-none focus-visible:ring-0 border-black"
          />

          <div className="absolute bg-black text-white p-2 text-center">Rs</div>
        </div>
        <div className="flex justify-between mt-1">
          <Button size={"lg"} variant="destructive" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-4" /> Clear
          </Button>
          {!editInvoice && (
            <Button
              size={"lg"}
              variant="outline"
              onClick={handleEditInvoice}
              className="border-black"
            >
              <FilePenLine className="w-4 h-4 mr-4" />
              <span className=" text-black font-bold">Edit Invoice</span>
            </Button>
          )}
          {editInvoice && (
            <Button
              size={"lg"}
              variant="outline"
              onClick={saveChangeInvoice}
              className="border-black"
            >
              <FilePenLine className="w-4 h-4 mr-4" />
              <span className=" text-black font-bold">Save Invoice</span>
            </Button>
          )}

          {/* Only show the PayNow button if customer type is wholesale and mode is wholesale */}
          {mode === "wholesale" &&
            (selectedCustomer?.type?.toLocaleLowerCase() === "wholesale" ? (
              <PayNowChart
                grandTotal={grandTotal}
                discount={discount}
                productList={chartList}
                disInPercentage={disInPrecentage}
                selectedCustomer={selectedCustomer}
                handleReset={handleReset}
              />
            ) : (
              <Button
                size={"sm"}
                variant="destructive"
                className="animate-bounce"
              >
                <span className="text-white">
                  Customer must be Wholesaler for Wholesale Mode
                </span>
              </Button>
            ))}

          {mode === "retail" && (
            <PayNowChart
              grandTotal={grandTotal}
              discount={discount}
              productList={chartList}
              disInPercentage={disInPrecentage}
              selectedCustomer={selectedCustomer}
              handleReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BillTable;
