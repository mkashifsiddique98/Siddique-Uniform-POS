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
import { BadgePlus, MinusSquare, PlusSquare, RotateCcw, XCircle } from "lucide-react";
import React, { FC, useState } from "react";
import PayNowChart from "./pay-now";
import { Label } from "@/components/ui/label";
import {
  Products,
  clearChart,
  removeItemChart,
  updateChart,
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";
import { calculatePercentage } from "@/utils";
import { customer } from "@/types/customer";
interface BillTableProps {
  selectedCustomer?: customer;
}
const BillTable: FC<BillTableProps> = ({ selectedCustomer }) => {
  //  ==============================================
  const chartList: Products[] = useTypedSelector(
    (state) => state.chart.chartList
  );
  const dispatch = useAppDispatch();

  const [discount, setDiscount] = useState<number>(0);
  let grandTotal = chartList.reduce((total, product) => {
    let lineTotal = product.quantity * product.sellPrice;
    return total + lineTotal;
  }, 0);
  let disInPrecentage = calculatePercentage(discount, grandTotal);
  grandTotal = grandTotal - (discount ? discount : 0);
  //  Function Reset
  const handleReset = () => {
    dispatch(clearChart());
    setDiscount(0);
    grandTotal = 0;
  };
  // Function Update
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
  // Function Remove
  const handleRemoveItem = (productName: string) => {
    dispatch(removeItemChart({ productName }));
  };
  // *************************************for Special stiching Customer ***********
  const [specialProductName, setSpecialProductName] = useState("");
  const [specialProductPrice, setSpecialProductPrice] = useState<number | "">(
    ""
  );
  const [specialProductQty, setSpecialProductQty] = useState<number | "">("");

  const handleAddSpecialProduct = () => {
    if (specialProductName && specialProductPrice && specialProductQty) {
      const newProduct: Products ={
          productName: specialProductName,
          sellPrice: specialProductPrice,
          quantity: specialProductQty,
          category: 'special', // or another default category if needed
          size: "N/A", // handle size or set to default if not applicable
          productCost: 0, // you may want to adjust this based on your logic
          stockAlert: 0, // if you need to track this for special stitching
          productId:Object, 
          schoolName:"special", 
          wholesalePrice:0
      }
      dispatch(
        updateChart(newProduct)
      );
      console.log("chartList",chartList)
      // Reset special product inputs after adding
      setSpecialProductName("");
      setSpecialProductPrice("");
      setSpecialProductQty("");
    } else {
      console.error("All fields must be filled");
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
          <TableHead className="text-center font-semibold">Quantity</TableHead>
          <TableHead className="text-center font-semibold">Line Total</TableHead>
          <TableHead className="text-center font-semibold">Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {chartList.map((product, index) => (
          <TableRow key={index}>
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
            <TableCell>
              <span
                className="cursor-pointer"
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
                style={{minWidth:"250px"}}
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
                style={{minWidth:"100px"}}
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
            disabled={chartList.length <= 0}
            value={discount}
            defaultValue={0}
            onChange={(e) => setDiscount(parseInt(e.target.value, 10))}
            className="w-32 rounded-none focus-visible:ring-0"
          />
          <div className="absolute bg-black text-white p-2 text-center">Rs</div>
        </div>
        <div className="flex justify-evenly mt-1">
          <Button size={"lg"} variant="destructive" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-4" /> Reset
          </Button>
          <PayNowChart
            grandTotal={grandTotal}
            discount={discount}
            productList={chartList}
            disInPercentage={disInPrecentage}
            selectedCustomer={selectedCustomer}
            handleReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
};

export default BillTable;
