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
  AlertTriangleIcon,
  BadgePlus,
  Delete,
  FilePenLine,
  MinusSquare,
  PlusSquare,
  RotateCcw,
  XCircle,
} from "lucide-react";
import React, { FC, useState } from "react";
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
import { customer } from "@/types/customer";
import { handleGenerateNewInvoiceNumber } from "./usePos";
import LoadingSpinner from "@/components/custom-components/loadingSpinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BillTableProps {
  selectedCustomer?: customer;
  handleEditInvoice: () => void;
  editInvoice: boolean;
  errorMessage: string;
  loading: boolean;
}

const BillTable: FC<BillTableProps> = ({
  selectedCustomer,
  handleEditInvoice,
  editInvoice,
  errorMessage,
  loading,
}) => {
  // Local State
  const [specialProductName, setSpecialProductName] = useState("");
  const [specialProductPrice, setSpecialProductPrice] = useState<number | "">(
    ""
  );
  const [specialProductQty, setSpecialProductQty] = useState<number | "">("");
  const [disInPrecentage, setDisInPrecentage] = useState<number>(0);

  // Redux State
  const dispatch = useAppDispatch();
  const chartList: Products[] = useTypedSelector(
    (state) => state.chart.chartList
  );
  const discount: number = useTypedSelector((state) => state.invoice.discount);
  const invoiceNo: number = useTypedSelector(
    (state) => state.invoice.invoiceNumber
  );

  const mode = useTypedSelector((state) => state.mode); // retail / wholesale

  // Calculate subtotal & grand total
  const calcSubtotal = (items: Products[]) =>
    items.reduce(
      (total, product) => total + product.sellPrice * product.quantity,
      0
    );

  let grandTotal = calcSubtotal(chartList) - discount;
  grandTotal = Math.max(0, grandTotal);

  // Discount logic
  const calculateDiscount = (value: string) => {
    setDisInPrecentage(parseInt(value, 10));
    const disInPrecentageTemp = parseInt(value, 10);
    const discountAmount = (grandTotal * disInPrecentageTemp) / 100;
    dispatch(setDiscount(Math.max(0, parseInt(discountAmount.toString()))));
  };

  // Reset
  const handleReset = () => {
    if (editInvoice) handleEditInvoice();
    setDisInPrecentage(0);
    dispatch(clearChart());
    dispatch(setDiscount(0));

    // Invoice number accuracy
    const storedValue = Number(localStorage.getItem("invoiceNo")) || 0;
    const newInvoiceNumber = Math.max(storedValue, invoiceNo);
    dispatch(setInvoiceNumber(newInvoiceNumber));
  };

  // Update qty
  const handleUpdate = (productName: string, change: number) => {
    dispatch(
      updateChart({
        productName: productName,
        quantity: change,
      })
    );
  };

  // Remove item
  const handleRemoveItem = (productName: string) => {
    dispatch(removeItemChart({ productName }));
  };

  // Add special product
  const handleAddSpecialProduct = () => {
    if (specialProductName && specialProductPrice && specialProductQty) {
      const newProduct: Products = {
        productName: specialProductName,
        sellPrice: Number(specialProductPrice),
        quantity: Number(specialProductQty),
        category: "special",
        size: "N/A",
        productCost: 0,
        stockAlert: 0,
        productId: Object,
        schoolName: "special",
        wholesalePrice: 0,
        images: [],
      };
      dispatch(updateChart(newProduct));
      setSpecialProductName("");
      setSpecialProductPrice("");
      setSpecialProductQty("");
    }
  };

  // Save changes
  const saveChangeInvoice = async () => {
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
    <div className="flex flex-col justify-between h-[75vh] relative">
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
                  <p className="w-6">{product.quantity}</p>
                  <button onClick={() => handleUpdate(product.productName, 1)}>
                    <PlusSquare />
                  </button>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {product.quantity * product.sellPrice}
              </TableCell>
              <TableCell className="text-right">
                <span
                  title="remove item"
                  className="cursor-pointer text-center"
                  onClick={() => handleRemoveItem(product.productName)}
                >
                  <XCircle className="text-red-500" />
                </span>
              </TableCell>
            </TableRow>
          ))}

          {/* Special Stitching Customer */}
          {selectedCustomer?.type === "special-sitching" && (
            <TableRow>
              <TableCell colSpan={2}>
                <Input
                  placeholder="Product Name"
                  value={specialProductName}
                  onChange={(e) => setSpecialProductName(e.target.value)}
                />
              </TableCell>
              <TableCell className="text-right">
                <Input
                  placeholder="Qty"
                  type="number"
                  value={specialProductQty}
                  onChange={(e) =>
                    setSpecialProductQty(parseInt(e.target.value, 10))
                  }
                />
              </TableCell>
              <TableCell className="text-right">
                <Input
                  placeholder="Sell Price"
                  type="number"
                  value={specialProductPrice}
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

      {loading ? (
        <LoadingSpinner />
      ) : (
        chartList.length === 0 && (
          <div className="relative mt-1 text-center text-white capitalize bg-gray-400 text-lg w-full p-2 animate-pulse">
            {errorMessage || "Empty Product List"}
          </div>
        )
      )}

      <div>
        <div
          className={`w-full bg-black p-2 ${
            editInvoice ? "flex justify-between items-center" : "text-center"
          } text-white`}
        >
          <p className="font-semibold">
            Grand Total : Rs {Number(grandTotal) ? Number(grandTotal) : "0.00"}
          </p>
        </div>

        {/* Discount */}
        <div className="flex justify-end mr-16 mt-2 -mb-2">
          <Label htmlFor="discount">Discount</Label>
        </div>
        <div className="flex justify-end mt-3 relative">
          <Select
            value={disInPrecentage.toString()}
            onValueChange={calculateDiscount}
            disabled={chartList.length <= 0}
          >
            <SelectTrigger className="w-52 rounded-none border-black">
              <SelectValue placeholder="Select a discount" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Discount Value</SelectLabel>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="5">5%</SelectItem>
                <SelectItem value="7">7%</SelectItem>
                <SelectItem value="10">10%</SelectItem>
                <SelectItem value="15">15%</SelectItem>
                <SelectItem value="20">20%</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
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
            className="w-32 rounded-none border-black"
          />
          <div className="absolute bg-black text-white p-2 text-center">Rs</div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-1 flex-1 gap-2 flex-wrap">
          <Button size={"default"} variant="destructive" onClick={handleReset}>
            {editInvoice ? (
              <>
                <Delete />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-4" />
                <span>Clear</span>
              </>
            )}
          </Button>
          {!editInvoice && (
            <Button
              size={"default"}
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
              disabled={loading}
              size={"default"}
              variant="outline"
              onClick={saveChangeInvoice}
              className={`btn border-black ${
                loading ? "btn-disabled" : "btn-primary"
              }`}
            >
              <FilePenLine className="w-4 h-4 mr-4" />
              <span className=" text-black font-bold">
                {loading ? <LoadingSpinner /> : "Save Invoice"}
              </span>
            </Button>
          )}

          {/* Pay Now */}
          {mode === "wholesale" &&
            (selectedCustomer?.type?.toLocaleLowerCase() === "wholesale" ? (
              <PayNowChart
                editInvoice={editInvoice}
                grandTotal={Number(grandTotal)}
                discount={discount}
                productList={chartList}
                disInPercentage={disInPrecentage}
                selectedCustomer={selectedCustomer}
                handleReset={handleReset}
              />
            ) : (
              <Button
                size="lg"
                variant="destructive"
                className="px-4 py-2 flex items-center gap-2 animate-bounce bg-yellow-400 cursor-not-allowed"
              >
                <AlertTriangleIcon className="w-4 h-4 text-white" />
                <p className="text-white text-sm font-medium">
                  Customer is not wholesaler
                </p>
              </Button>
            ))}

          {mode === "retail" && (
            <PayNowChart
              editInvoice={editInvoice}
              grandTotal={Number(grandTotal)}
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
