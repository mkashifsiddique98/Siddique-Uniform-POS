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
import { MinusSquare, PlusSquare, RotateCcw, XCircle } from "lucide-react";
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
  return (
    <div className="flex flex-col justify-between h-[75vh]">
      <Table className="border-t">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] text-left font-semibold">
              Product
            </TableHead>
            <TableHead className="text-right font-semibold">Price</TableHead>
            <TableHead className="text-center font-semibold">
              Quantity
            </TableHead>
            <TableHead className="text-right font-semibold">
              Sub Total
            </TableHead>
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
                  <input
                    className="w-6"
                    value={product.quantity}
                    // onChange={(e) => {
                    //   setLiveQty(parseInt(e.target.value, 10));
                    // }}
                  />

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
        </TableBody>
      </Table>
      {chartList.length === 0 && (
        <div className="relative -top-28 mt-1 text-center text-white capitalize bg-gray-400 text-lg w-full p-2">
          No Product Data Available
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
          />
        </div>
      </div>
    </div>
  );
};

export default BillTable;
