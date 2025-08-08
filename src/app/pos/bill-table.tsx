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
  Eye,
  EyeOff,
  FilePenLine,
  MinusSquare,
  PlusSquare,
  Redo2Icon,
  RotateCcw,
  Undo2,
  View,
  XCircle,
  Printer
} from "lucide-react";
import React, { FC, useEffect, useState } from "react";
import PayNowChart from "./pay-now";
import { Label } from "@/components/ui/label";
import {
  Products,
  clearChart,
  handleReturnItemChart,
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
import LoadingSpinner from "@/components/custom-components/loadingSpinner";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductDetail } from "@/types/invoice";

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
  loading
}) => {

  // Local State 
  const [specialProductName, setSpecialProductName] = useState("");
  const [specialProductPrice, setSpecialProductPrice] = useState<number | "">("");
  const [specialProductQty, setSpecialProductQty] = useState<number | "">("");
  const [showReturnList, setShowReturnList] = useState<boolean>(false)
  const [disInPrecentage, setDisInPrecentage] = useState<number>(0)

  // Redux State
  const dispatch = useAppDispatch();
  const chartList: Products[] = useTypedSelector((state) => state.chart.chartList);
  const discount: number = useTypedSelector((state) => state.invoice.discount);
  const invoiceNo: number = useTypedSelector(
    (state) => state.invoice.invoiceNumber
  );

  // Modifty for return 
  const mode = useTypedSelector((state) => state.mode); // mode

  // Product Filter via Category
  const returnItems = chartList.filter((product) => product.return);
  const alreadyBoughtItems = chartList.filter((product) => product.sold && !product.return);
  const newItems = chartList.filter((product) => !product.sold && !product.return);

  // Function to Calcuate 
  const calcSubtotal = (items: ProductDetail[] | any[]) =>
    items.reduce((total, product) => total + product.sellPrice * product.quantity, 0);

  // Sub Total Value
  const newTotalAmount = calcSubtotal(newItems);
  const returnTotalAmount = calcSubtotal(returnItems);
  const alreadyBoughtTotalAmount = calcSubtotal(alreadyBoughtItems);

  // Calculate Grand Total
  let calculatedTotal = newTotalAmount;
  
  // Grand-Total Calculate
  if (editInvoice) {
    calculatedTotal += alreadyBoughtTotalAmount;
  }
  var grandTotal:Number = calculatedTotal - returnTotalAmount - (discount || 0);
 
  // my old Logic
  // var grandTotal = returnTotalAmount > 0 ? (newTotalAmount - returnTotalAmount) : newTotalAmount;
  // grandTotal = grandTotal - (discount ? discount : 0);

 
  // This for Edit Invoice : ==> 
  // grandTotal = editInvoice ? Math.max(0, grandTotal) : grandTotal
  // Calcaute Discount for Product to store in state
  // not to display 

  const calculateDiscount = (value: string) => {
    // Sate to Pass in other Comp
    setDisInPrecentage(parseInt(value, 10))
    // logic to Store in Redux to pass
    const disInPrecentageTemp = parseInt(value, 10)
    const discountAmount = (grandTotal * disInPrecentageTemp) / 100;
    dispatch(setDiscount(Math.max(0, parseInt(discountAmount))))
  }

  // Rest for CLear the Table
  const handleReset = () => {

    if (editInvoice) handleEditInvoice();
    setDisInPrecentage(0)
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
  // Function to Return Item from chart
  const handleReturnItem = (productName: string) => {
    dispatch(handleReturnItemChart({ productName, return: true }));
  };
  const handleReturnItemUndo = (productName: string) => {
    dispatch(handleReturnItemChart({ productName, return: false }));
  };
  const handleReturnDisplay = () => {
    setShowReturnList(!showReturnList)
  }
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
    // In case if some try to save empty invoice

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
          {/* Regular Item */}
          {chartList
            .filter((product) => !product.return)
            .map((product, index) => (
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
                  {product.sold ?
                    <span
                      title="return item"
                      className="cursor-pointer text-center"
                      onClick={() => handleReturnItem(product.productName)}
                    >
                      <Undo2 className="text-red-700" />
                    </span> : <span
                      title="remove from list"
                      className="cursor-pointer text-center"
                      onClick={() => handleRemoveItem(product.productName)}
                    >
                      <XCircle className="text-red-500" />

                    </span>
                  }

                </TableCell>
              </TableRow>
            ))}
          {/* Show Button return */}
          {chartList.filter((product) => product.return).length >= 1 && <>
            {/* Show Title for Return Item */}
            <TableRow>
              {editInvoice && chartList.length > 0 &&
                <p
                  title="Show List of Return Item "
                  className="text-lg underline font-bold m-2 flex justify-start items-center gap-2 hover:border-green-500 border hover:text-green-500 p-2 cursor-pointer w-[100%]" onClick={handleReturnDisplay}>Return Item
                  <span className="inline-block text-green-500">{showReturnList ? <EyeOff /> : <Eye />}</span></p>}

            </TableRow> {/* Return Item in Table*/}
            {showReturnList &&
              chartList
                .filter((product) => product.return)
                .map((product, index) => (
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
                    <TableCell className="text-right">
                      {product.sold ?
                        <span
                          title="undo-return item"
                          className="cursor-pointer text-center"
                          onClick={() => handleReturnItemUndo(product.productName)}
                        >
                          <Redo2Icon className="text-green-500" />
                        </span> : <span
                          title="remove from list"
                          className="cursor-pointer text-center"
                          onClick={() => handleRemoveItem(product.productName)}
                        >
                          <XCircle className="text-red-500" />

                        </span>
                      }

                    </TableCell>
                  </TableRow>
                ))}
          </>}
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
      {loading ? <LoadingSpinner /> : <>
        {chartList.length === 0 && (
          <div className="relative mt-1 text-center text-white capitalize bg-gray-400 text-lg w-full p-2 animate-pulse">
            {errorMessage || "Empty Product List"}
          </div>
        )}
      </>}

      <div>
        <div className={`w-full bg-black p-2 ${editInvoice ? "flex justify-between items-center" : "text-center"}  text-white`}>
          <p className="font-semibold">
            Grand Total : Rs {grandTotal ? grandTotal : "0.00"}
          </p>
          {returnTotalAmount > 0 && editInvoice && <p className="font-semibold">
            Return Item : Rs {returnTotalAmount ? returnTotalAmount : "0.00"}
          </p>
          }
          {alreadyBoughtTotalAmount > 0 && editInvoice && <p className="font-semibold">
            Already Buy Item : Rs {alreadyBoughtTotalAmount ? alreadyBoughtTotalAmount : "0.00"}
          </p>
          }
        </div>

        <div className="flex justify-end mr-16 mt-2 -mb-2">
          <Label htmlFor="discount">Discount</Label>
        </div>

        <div className="flex justify-end mt-3 relative">
          <>

            <Select
              value={disInPrecentage.toString()}
              onValueChange={calculateDiscount}
              disabled={chartList.length <= 0}>
              <SelectTrigger className="w-52 rounded-none  border-black">
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
          </>
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

        <div className="flex justify-between mt-1 flex-1 gap-2 flex-wrap">
          <Button size={"default"} variant="destructive" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-4" /> Clear
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
              className={`btn border-black ${loading ? "btn-disabled" : "btn-primary"}`}
            >
              <FilePenLine className="w-4 h-4 mr-4" />
              <span className=" text-black font-bold">{loading ? <LoadingSpinner /> : "Save Invoice"}</span>
            </Button>


          )}
         
          {/* Only show the PayNow button if customer type is wholesale and mode is wholesale */}
          {mode === "wholesale" &&
            (selectedCustomer?.type?.toLocaleLowerCase() === "wholesale" ? (
              <PayNowChart
              editInvoice={editInvoice}
                grandTotal={grandTotal}
                discount={discount}
                productList={chartList}
                disInPercentage={disInPrecentage}
                selectedCustomer={selectedCustomer}
                handleReset={handleReset}
              />
            ) : (
              <Button size="lg" variant="destructive" className="px-4 py-2 flex items-center gap-2 animate-bounce bg-yellow-400 cursor-not-allowed">
                <AlertTriangleIcon className="w-4 h-4 text-white" />
                <p className="text-white text-sm font-medium">
                  Customer is not wholesaler
                </p>
              </Button>
            ))}

          {mode === "retail" && (
            <PayNowChart
              // Edit Invoice 
              // I add  alreadyBoughtTotalAmount  becuase its not Paynow  my or not
              // Working Paid
              editInvoice={editInvoice}
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
