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

import React, { FC, useEffect, useRef, useState } from "react";

import PayNowChart from "./pay-now";
import { handleGenerateNewInvoiceNumber } from "./usePos";
import { useStockSync } from "./useStockSync";
import { stockRefreshGate } from "@/lib/stockRefresh";

import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import {
  Products,
  addToChart,
  addMultipleToChart,
  applyPriceMode,
  clearChart,
  getCartItemKey,
  removeItemChart,
  setCartReturns,
  setDiscount,
  setInvoiceNumber,
  updateChart,
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";

import { customer } from "@/types/customer";
import { calculateInvoiceTotals, canonicalizeLines } from "@/lib/posHelpers";
import ReturnDetailsDialog, { ReturnBadge } from "./ReturnDetailsDialog";

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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BillTableProps {
  selectedCustomer?: customer;
  handleEditInvoice: () => void;
  editInvoice: boolean;
  errorMessage: string;
  loading: boolean;
  // MongoDB Invoice _id
  invoiceId?: string;
}

const isReturnLine = (product: Products) =>
  product.mode === "return";

const BillTable: FC<BillTableProps> = ({
  selectedCustomer,
  handleEditInvoice,
  editInvoice,
  errorMessage,
  loading,
  invoiceId,
}) => {
  const [specialProductName, setSpecialProductName] =
    useState("");
  const [saving, setSaving] = useState(false);
  const { refreshStock } = useStockSync();
  const savingRef = useRef(false);

  const [specialProductPrice, setSpecialProductPrice] =
    useState<number | "">("");

  const [specialProductQty, setSpecialProductQty] =
    useState<number | "">("");

  const [disInPrecentage, setDisInPrecentage] =
    useState<number>(0);

  const [returnDialogOpen, setReturnDialogOpen] =
    useState(false);

  const [selectedReturnProduct, setSelectedReturnProduct] =
    useState<Products | null>(null);

  const [returnQuantity, setReturnQuantity] =
    useState<number>(1);

  const [returnReason, setReturnReason] =
    useState("");

  // Return details dialog: lines are saved invoice lines, so cancel indexes match the server
  const [returnsView, setReturnsView] = useState<{
    lines: any[];
    highlightFrom: number | null;
    canCancel: boolean;
  } | null>(null);

  const openSavedReturns = async () => {
    try {
      const response = await fetch("/api/invoice/GET_BY_ID", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNo }),
      });
      const data = await response.json();
      if (!response.ok || !data.response) throw new Error(data?.error || "Invoice not found");
      setReturnsView({ lines: data.response.productDetail, highlightFrom: null, canCancel: true });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not load returns",
        description: error instanceof Error ? error.message : "Failed to load returns.",
      });
    }
  };

  const cancelSavedReturn = async (lineIndex: number, returnIndex: number) => {
    if (!invoiceId) return;
    if (!window.confirm("Cancel this return? The units are taken out of stock again.")) return;
    try {
      const response = await fetch("/api/invoice/return/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoiceId, lineIndex, returnIndex }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to cancel return.");
      const lines = canonicalizeLines(data.response.productDetail) as Products[];
      setReturnsView({ lines, highlightFrom: null, canCancel: true });
      dispatch(setCartReturns(lines));
      refreshStock();
      toast({ description: data.message });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Return not cancelled",
        description: error instanceof Error ? error.message : "Failed to cancel return.",
      });
    }
  };

  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const chartList: Products[] = useTypedSelector(
    (state) => state.chart.chartList
  );
  
  const discount: number = useTypedSelector(
    (state) => state.invoice.discount
  );

  const invoiceNo: number = useTypedSelector(
    (state) => state.invoice.invoiceNumber
  );

  const mode = useTypedSelector(
    (state) => state.mode
  );

  useEffect(() => {
    dispatch(
      applyPriceMode(
        mode === "wholesale" ? "wholesale" : "retail"
      )
    );
  }, [mode, dispatch]);

  const saleLines = chartList.filter(
    (product) => !isReturnLine(product)
  );
  const returnLines = chartList.filter(isReturnLine);

  // Returns are negative lines, so the subtotal already has them subtracted
  const { grandTotal } = calculateInvoiceTotals({
    items: chartList,
    discount,
  });

  // Units of a product that can still be returned: sold on this invoice minus already returned
  const getReturnableQty = (product: Products) =>
    Number(product.quantity) - returnedQtyOf(product);

  const calculateDiscount = (value: string) => {
    const percentage = parseInt(value, 10) || 0;

    setDisInPrecentage(percentage);

    const discountAmount =
      (grandTotal * percentage) / 100;

    dispatch(
      setDiscount(
        Math.max(0, Math.floor(discountAmount))
      )
    );
  };

  const handleReset = () => {
    if (editInvoice) {
      handleEditInvoice();
    }
    setDisInPrecentage(0);
    setReturnDialogOpen(false);
    setSelectedReturnProduct(null);
    setReturnQuantity(1);
    dispatch(clearChart());
    dispatch(setDiscount(0));

    // Preview only; the server assigns the real number on save
    void handleGenerateNewInvoiceNumber().then((next) => {
      if (next) dispatch(setInvoiceNumber(next));
    });
  };

  const openReturnDialog = (product: Products) => {
    if (!product.productId) {
      console.error(
        "Original productId is missing:",
        product
      );
      return;
    }

    setSelectedReturnProduct(product);
    setReturnQuantity(1);
    setReturnDialogOpen(true);
  };

  const confirmReturn = () => {
    if (!selectedReturnProduct) return;

    const productId =
      selectedReturnProduct.productId;

    const reason = returnReason.trim();
    const qty = Number(returnQuantity);

    const availableQty =
      getReturnableQty(selectedReturnProduct);

    if (!productId) {
      console.error(
        "Original productId is missing."
      );
      return;
    }

    if (
      !Number.isInteger(qty) ||
      qty <= 0 ||
      qty > availableQty
    ) {
      return;
    }

    // The sold line stays as it is; the return is its own negative line
    const returnKey = getCartItemKey({
      productId,
      mode: "return",
    });
    const existingReturn = returnLines.find(
      (line) => getCartItemKey(line) === returnKey
    );

    if (existingReturn) {
      dispatch(
        updateChart({
          productId,
          productName:
            selectedReturnProduct.productName,
          quantity: qty,
          mode: "return",
          returnReason: reason || undefined,
        })
      );
    } else {
      dispatch(
        addToChart({
          ...selectedReturnProduct,
          productId,
          quantity: qty,
          mode: "return",
          return: true,
          sold: false,
          stock: undefined,
          returnReason: reason || undefined,
        })
      );
    }

    setReturnDialogOpen(false);
    setSelectedReturnProduct(null);
    setReturnQuantity(1);
    setReturnReason("");
  };

  // The sold line was never changed, so cancelling a return only removes the return line
  const removeReturnedProduct = (
    product: Products
  ) => {
    dispatch(
      removeItemChart({
        productId: product.productId,
        _id: product._id,
        tempId: product.tempId,
        mode: "return",
      })
    );
  };

  // Saved returns on the sale line plus the pending return line in the cart
  const returnedQtyOf = (product: Products) => {
    const key = getCartItemKey({
      ...product,
      mode: "return",
    });
    const pending =
      returnLines.find(
        (line) => getCartItemKey(line) === key
      )?.quantity || 0;
    return Number(product.returnedQty || 0) + pending;
  };

  const warnReturned = (product: Products, removing = false) =>
    toast({
      variant: "destructive",
      title: removing ? "Item cannot be removed" : "Quantity too low",
      description: removing
        ? `${returnedQtyOf(product)} already returned of ${product.productName}. A line with returns cannot be removed; its history is kept.`
        : `${returnedQtyOf(product)} already returned of ${product.productName}. Quantity cannot go below that.`,
    });

  const handleUpdate = (
    product: Products,
    change: number
  ) => {
    if (
      change < 0 &&
      product.quantity + change <
        returnedQtyOf(product)
    ) {
      warnReturned(product);
      return;
    }

    if (
      change > 0 &&
      product.mode !== "return" &&
      product.oversellMode === "block" &&
      product.stock !== undefined &&
      product.quantity + change > product.stock
    ) {
      toast({
        variant: "destructive",
        title: "Not enough stock",
        description: `Only ${product.stock} piece(s) of ${product.productName} available.`,
      });
      return;
    }

    dispatch(
      updateChart({
        productId: product.productId,
        _id: product._id,
        tempId: product.tempId,
        productName: product.productName,
        quantity: change,
      })
    );
  };

  const handleRemoveItem = (
    product: Products
  ) => {
    if (returnedQtyOf(product) > 0) {
      warnReturned(product, true);
      return;
    }

    dispatch(
      removeItemChart({
        productId: product.productId,
        _id: product._id,
        tempId: product.tempId,
      })
    );
  };

  const handleAddSpecialProduct = () => {
    if (
      !specialProductName ||
      !specialProductPrice ||
      !specialProductQty
    ) {
      return;
    }

    const newProduct: Products = {
      productName: specialProductName,
      sellPrice: Number(specialProductPrice),
      quantity: Number(specialProductQty),
      category: "special",
      size: "N/A",
      productCost: 0,
      stockAlert: 0,
      schoolName: "special",
      wholesalePrice: 0,
      images: [],
      productId: undefined,
    };

    dispatch(updateChart(newProduct));

    setSpecialProductName("");
    setSpecialProductPrice("");
    setSpecialProductQty("");
  };

  const saveChangeInvoice = async () => {
    // Ref-based flag so a fast double click cannot send two requests
    if (savingRef.current) return;

    if (chartList.length === 0) {
      toast({
        variant: "destructive",
        title: "Invoice has no items",
        description:
          "An empty invoice cannot be saved. Cancel the edit, or delete the invoice from the invoice list.",
      });
      return;
    }
    savingRef.current = true;
    stockRefreshGate.beginSave();
    setSaving(true);
    try {
      await saveEditedInvoice();
    } finally {
      savingRef.current = false;
      stockRefreshGate.endSave();
      setSaving(false);
    }
  };

  const saveEditedInvoice = async () => {
    const invoiceProducts = chartList.map(
      (product) => {
        const isReturn = isReturnLine(product);

        return {
          productId: product.productId
            ? product.productId.toString()
            : undefined,

          productName: product.productName,

          quantity: Number(product.quantity || 0),

          sellPrice: Number(product.sellPrice || 0),

          mode: isReturn ? "return" : "sale",

          return: isReturn,

          sold: !isReturn,

          ...(isReturn && product.returnReason
            ? { returnReason: product.returnReason }
            : {}),
        };
      }
    );

    // One call: the server saves the invoice and updates stock in a single transaction
    try {
      const invoiceDetail = {
        customer: selectedCustomer,

        productDetail: invoiceProducts,

        discount,

        grandTotal,

        invoiceNo,

        isEdit: true,

        dueDate: null,

        anyMessage: "",

        prevBalance: 0,
      };

      const response = await fetch(
        "/api/invoice/",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            invoiceDetail
          ),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // 409: stock changed or a return was rejected, so show the cashier the real numbers
        if (response.status === 409) refreshStock();
        throw new Error(
          result?.error ||
            "Failed to save invoice."
        );
      }

      refreshStock();
      // Show the cashier the time and refund of the return that was just saved
      const savedReturns = invoiceProducts.some((line) => line.mode === "return");
      if (result?.response?.productDetail && savedReturns) {
        // All entries of one save share the server timestamp, so the newest one marks them
        const savedLines = canonicalizeLines(result.response.productDetail) as Products[];
        const times = savedLines
          .flatMap((line) => line.returns || [])
          .map((entry) => (entry.at ? new Date(entry.at).getTime() : 0));
        setReturnsView({
          lines: savedLines,
          highlightFrom: times.length ? Math.max(...times) : null,
          canCancel: true,
        });
        // Stay in edit mode and reload the cart from the server, so history and returned quantities are current
        dispatch(clearChart());
        dispatch(addMultipleToChart(savedLines));
        dispatch(setDiscount(Number(result.response.discount || 0)));
        return;
      }
      handleReset();
    } catch (error) {
      console.error(
        "Save invoice error:",
        error
      );
      toast({
        variant: "destructive",
        title: "Invoice not saved",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save invoice.",
      });
    }
  };

  return (
    <div className="flex flex-col justify-between h-[75vh] relative">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] text-left font-semibold">
                Product
              </TableHead>

              <TableHead className="text-right font-semibold">
                Price
              </TableHead>

              <TableHead className="text-center font-semibold">
                Quantity
              </TableHead>

              <TableHead className="text-center font-semibold">
                Line Total
              </TableHead>

              <TableHead className="text-center font-semibold">
                Action
              </TableHead>

              {editInvoice && (
                <TableHead className="text-center font-semibold">
                  Return
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {saleLines.map(
              (product, index) => (
                <TableRow
                  className={product.stockShort ? "bg-red-100" : undefined}
                  key={
                    getCartItemKey(product) ||
                    `${index}-${product.productName}`
                  }
                >
                  <TableCell>
                    {product.productName}
                    {editInvoice && (
                      <ReturnBadge
                        count={Number(product.returnedQty || 0)}
                        onClick={openSavedReturns}
                      />
                    )}
                    {editInvoice && Number(product.returnedQty || 0) > 0 && (
                      <span className="block text-xs text-gray-500">
                        Sold {product.quantity} · Returned {Number(product.returnedQty)} · Net{" "}
                        {product.quantity - Number(product.returnedQty)}
                      </span>
                    )}
                    {product.oversellMode !== "block" &&
                      product.stock !== undefined &&
                      product.quantity > Math.max(0, product.stock) && (
                        <span className="block text-xs text-amber-600">
                          Only {Math.max(0, product.stock)} in stock, {product.quantity - Math.max(0, product.stock)} will be sold beyond stock
                        </span>
                      )}
                  </TableCell>

                  <TableCell className="text-right">
                    {product.sellPrice}
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex justify-evenly items-center">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdate(
                            product,
                            -1
                          )
                        }
                        disabled={
                          product.quantity <= 0
                        }
                      >
                        <MinusSquare />
                      </button>

                      <p className="w-6">
                        {product.quantity}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdate(
                            product,
                            1
                          )
                        }
                      >
                        <PlusSquare />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    {product.quantity *
                      product.sellPrice}
                  </TableCell>

                  <TableCell className="text-right">
                    <span
                      title="remove item"
                      className="cursor-pointer"
                      onClick={() =>
                        handleRemoveItem(
                          product
                        )
                      }
                    >
                      <XCircle className="text-red-500" />
                    </span>
                  </TableCell>

                  {editInvoice && (
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300"
                        onClick={() =>
                          openReturnDialog(
                            product
                          )
                        }
                        disabled={
                          !product.productId ||
                          getReturnableQty(product) <= 0
                        }
                      >
                        Return
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            )}

            {selectedCustomer?.type ===
              "special-sitching" && (
              <TableRow>
                <TableCell colSpan={2}>
                  <Input
                    placeholder="Product Name"
                    value={specialProductName}
                    onChange={(e) =>
                      setSpecialProductName(
                        e.target.value
                      )
                    }
                  />
                </TableCell>

                <TableCell>
                  <Input
                    placeholder="Qty"
                    type="number"
                    min={1}
                    value={specialProductQty}
                    onChange={(e) =>
                      setSpecialProductQty(
                        parseInt(
                          e.target.value,
                          10
                        ) || ""
                      )
                    }
                  />
                </TableCell>

                <TableCell>
                  <Input
                    placeholder="Sell Price"
                    type="number"
                    min={0}
                    value={
                      specialProductPrice
                    }
                    onChange={(e) =>
                      setSpecialProductPrice(
                        parseFloat(
                          e.target.value
                        ) || ""
                      )
                    }
                  />
                </TableCell>

                <TableCell>
                  <Button
                    onClick={
                      handleAddSpecialProduct
                    }
                    size="sm"
                  >
                    <BadgePlus />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editInvoice &&
        returnLines.length > 0 && (
          <div className="mt-4 border-2 border-red-500 rounded-md overflow-hidden w-full">
            <div className="bg-red-500 text-white px-3 py-2 font-semibold">
              Returned Products
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Product
                  </TableHead>

                  <TableHead className="text-right">
                    Price
                  </TableHead>

                  <TableHead className="text-center">
                    Qty
                  </TableHead>

                  <TableHead className="text-right">
                    Amount
                  </TableHead>

                  <TableHead className="text-center">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {returnLines.map(
                  (product, index) => (
                    <TableRow
                      key={
                        getCartItemKey(product) ||
                        `${index}-${product.productName}`
                      }
                    >
                      <TableCell>
                        {
                          product.productName
                        }
                        {editInvoice &&
                          !saleLines.some(
                            (sale) => getCartItemKey(sale) === getCartItemKey({ ...product, mode: "sale" })
                          ) && <ReturnBadge count={Number(product.quantity)} onClick={openSavedReturns} />}
                      </TableCell>

                      <TableCell className="text-right">
                        Rs{" "}
                        {
                          product.sellPrice
                        }
                      </TableCell>

                      <TableCell className="text-center text-red-600 font-bold">
                        {product.quantity}
                      </TableCell>

                      <TableCell className="text-right text-red-600 font-bold">
                        -Rs{" "}
                        {product.sellPrice *
                          product.quantity}
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() =>
                            removeReturnedProduct(
                              product
                            )
                          }
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        chartList.length === 0 && (
          <div className="relative mt-1 text-center text-white capitalize bg-gray-400 text-lg w-full p-2 animate-pulse">
            {errorMessage ||
              "Empty Product List"}
          </div>
        )
      )}

      <div>
        <div
          className={`w-full bg-black p-2 ${
            editInvoice
              ? "flex justify-between items-center"
              : "text-center"
          } text-white`}
        >
          <p className="font-semibold">
            Grand Total : Rs{" "}
            {Number(grandTotal)
              ? Number(grandTotal)
              : "0.00"}
          </p>
        </div>

        <div className="flex justify-end mr-16 mt-2 -mb-2">
          <Label htmlFor="discount">
            Discount
          </Label>
        </div>

        <div className="flex justify-end mt-3 relative">
          <Select
            value={disInPrecentage.toString()}
            onValueChange={
              calculateDiscount
            }
            disabled={
              chartList.length <= 0
            }
          >
            <SelectTrigger className="w-52 rounded-none border-black">
              <SelectValue placeholder="Select a discount" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>
                  Discount Value
                </SelectLabel>

                <SelectItem value="0">
                  0%
                </SelectItem>

                <SelectItem value="5">
                  5%
                </SelectItem>

                <SelectItem value="7">
                  7%
                </SelectItem>

                <SelectItem value="10">
                  10%
                </SelectItem>

                <SelectItem value="15">
                  15%
                </SelectItem>

                <SelectItem value="20">
                  20%
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Input
            id="discount"
            placeholder="discount"
            type="number"
            min={0}
            disabled={
              chartList.length <= 0
            }
            value={discount}
            onChange={(e) =>
              dispatch(
                setDiscount(
                  Math.max(
                    0,
                    parseInt(
                      e.target.value,
                      10
                    ) || 0
                  )
                )
              )
            }
            className="w-32 rounded-none border-black"
          />

          <div className="absolute bg-black text-white p-2 text-center">
            Rs
          </div>
        </div>

        <div className="flex justify-between mt-1 flex-1 gap-2 flex-wrap">
          <Button
            size="default"
            variant="destructive"
            onClick={handleReset}
          >
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
              size="default"
              variant="outline"
              onClick={handleEditInvoice}
              className="border-black"
            >
              <FilePenLine className="w-4 h-4 mr-4" />
              <span className="text-black font-bold">
                Edit Invoice
              </span>
            </Button>
          )}

          {editInvoice && (
            <Button
              disabled={loading || saving}
              size="default"
              variant="outline"
              onClick={saveChangeInvoice}
              className="btn border-black"
            >
              <FilePenLine className="w-4 h-4 mr-4" />

              <span className="text-black font-bold">
                {loading || saving ? (
                  <LoadingSpinner />
                ) : (
                  "Save Invoice"
                )}
              </span>
            </Button>
          )}

          {mode === "wholesale" &&
            (selectedCustomer?.type?.toLowerCase() ===
            "wholesale" ? (
              <PayNowChart
                editInvoice={editInvoice}
                grandTotal={Number(
                  grandTotal
                )}
                discount={discount}
                productList={chartList}
                disInPercentage={
                  disInPrecentage
                }
                selectedCustomer={
                  selectedCustomer
                }
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
              disInPercentage={
                disInPrecentage
              }
              selectedCustomer={
                selectedCustomer
              }
              handleReset={handleReset}
            />
          )}
        </div>
      </div>

      <Dialog
        open={returnDialogOpen}
        onOpenChange={(open) => {
          setReturnDialogOpen(open);

          if (!open) {
            setSelectedReturnProduct(null);
            setReturnQuantity(1);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Return Product
            </DialogTitle>

            <DialogDescription>
              Select the quantity you want to
              return.
            </DialogDescription>
          </DialogHeader>

          {selectedReturnProduct && (
            <div className="space-y-4">
              <div className="rounded-md border p-3">
                <p className="text-sm text-gray-500">
                  Product
                </p>

                <p className="font-semibold">
                  {
                    selectedReturnProduct.productName
                  }
                </p>
              </div>

              <div className="rounded-md bg-gray-50 border p-3">
                <p className="text-xs text-gray-500">
                  Product ID
                </p>

                <p className="text-xs font-mono break-all">
                  {selectedReturnProduct.productId
                    ? String(selectedReturnProduct.productId)
                    : "No Product ID"}
                </p>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Price
                </span>

                <span className="font-semibold">
                  Rs{" "}
                  {
                    selectedReturnProduct.sellPrice
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Available Quantity
                </span>

                <span className="font-semibold">
                  {getReturnableQty(
                    selectedReturnProduct
                  )}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnQuantity">
                  Return Quantity
                </Label>

                <Input
                  id="returnQuantity"
                  type="number"
                  min={1}
                  max={getReturnableQty(
                    selectedReturnProduct
                  )}
                  value={returnQuantity}
                  onChange={(e) =>
                    setReturnQuantity(
                      Number(e.target.value)
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnReason">
                  Reason (optional)
                </Label>

                <Input
                  id="returnReason"
                  type="text"
                  maxLength={200}
                  value={returnReason}
                  onChange={(e) =>
                    setReturnReason(e.target.value)
                  }
                />
              </div>

              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <div className="flex justify-between">
                  <span className="font-medium">
                    Return Amount
                  </span>

                  <span className="font-bold text-red-600">
                    Rs{" "}
                    {selectedReturnProduct.sellPrice *
                      (Number(
                        returnQuantity
                      ) || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReturnDialogOpen(false);
                setSelectedReturnProduct(null);
                setReturnQuantity(1);
                setReturnReason("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={
                !selectedReturnProduct?.productId ||
                returnQuantity <= 0 ||
                returnQuantity >
                  (selectedReturnProduct
                    ? getReturnableQty(
                        selectedReturnProduct
                      )
                    : 0)
              }
              onClick={confirmReturn}
            >
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReturnDetailsDialog
        open={returnsView !== null}
        onOpenChange={(open) => {
          if (!open) setReturnsView(null);
        }}
        lines={returnsView?.lines || []}
        highlightFrom={returnsView?.highlightFrom}
        onCancelReturn={returnsView?.canCancel && invoiceId ? cancelSavedReturn : undefined}
      />
    </div>
  );
};

export default BillTable;