// store.ts
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
<<<<<<< HEAD
import { RootState } from "@/types";
import { ProductFormState } from "@/types/product";
import { computeReturnedQty, lineMatchKey } from "@/lib/posHelpers";

export interface Products extends ProductFormState {
  productId?: string | object | null;
  productName: string;
  quantity: number;
  sellPrice: number;
  return?: boolean;
  sold?: boolean;
  mode?: "sale" | "return";
  // Temporary id for items without a database id (e.g. special items)
  tempId?: string;
  // Available stock when the item was added; undefined means no limit
  stock?: number;
  // Retail price kept so the price can be recalculated when the price mode changes
  retailPrice?: number;
  // Set when a stock refresh found less stock than the quantity in the cart
  stockShort?: boolean;
  // Optional reason for a return line, stored in the return log
  returnReason?: string;
  // Returns already saved on this sale line (read-only here; the server owns them)
  returns?: ReturnEntryView[];
  returnedQty?: number;
}

export interface ReturnEntryView {
  qty: number;
  at?: string | Date;
  reason?: string;
  user?: string;
  refundAmount?: number;
  cancelled?: boolean;
}

type StockSource = { _id?: unknown; quantity?: number; isBundle?: boolean; oversellMode?: "clamp" | "block" };

// Cart sale lines (with a stock snapshot) whose quantity is above the latest stock, in "block" mode only.
// In "clamp" mode a line may exceed stock, so it is never a conflict.
// Lines without a snapshot (bundles, special items, lines loaded from a saved invoice) are never touched.
export const findStockConflicts = (
  chartList: Products[],
  products: StockSource[]
): Array<{ line: Products; available: number }> => {
  const byId = new Map<string, StockSource>();
  products.forEach((product) => {
    if (product._id != null) byId.set(String(product._id), product);
  });

  const conflicts: Array<{ line: Products; available: number }> = [];
  chartList.forEach((line) => {
    if (line.mode === "return" || line.stock === undefined || line.productId == null) return;
    if (line.oversellMode !== "block") return;
    const product = byId.get(String(line.productId));
    if (!product || product.isBundle || typeof product.quantity !== "number") return;
    if (line.quantity > product.quantity) conflicts.push({ line, available: product.quantity });
  });
  return conflicts;
};

type CartItemRef = {
  productId?: string | object | null;
  _id?: object;
  tempId?: string;
  mode?: "sale" | "return";
};

// A return line and a sale line of the same product are separate cart lines
export const getCartItemKey = (item: CartItemRef): string => {
  const id = item.productId ?? item._id ?? item.tempId;
  if (!id) return "";
  return item.mode === "return" ? `${String(id)}:return` : String(id);
};

// crypto.randomUUID is unavailable on non-secure (plain http) origins
const makeTempId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `tmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const withCartId = (item: Products): Products => {
  const productId = item.productId ?? item._id ?? undefined;
  return productId ? { ...item, productId } : { ...item, productId, tempId: item.tempId ?? makeTempId() };
};

=======
import { RootState } from "@/types"; // Define your RootState type in a separate file
import { ProductFormState } from "@/types/product";

export interface Products extends ProductFormState {
  productId: object | undefined;
  productName: string;
  quantity: number;
  sellPrice: number;
  return?:Boolean;
  sold?:Boolean;
}

>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
interface ChartState {
  chartList: Products[];
}

const initialState: ChartState = {
  chartList: [],
};

interface InvoiceState {
  invoiceNumber: number;
  discount: number; // Add discount field
}

// Initial state for invoice
const initialInvoiceState: InvoiceState = {
  invoiceNumber: 0, // Start from 1 or any initial value
  discount: 0, // Default discount value
};

// Chart slice
const chartSlice = createSlice({
  name: "chart",
  initialState,
  reducers: {
    // for single Product
    addToChart: (state, action: PayloadAction<Products>) => {
<<<<<<< HEAD
      state.chartList = [...state.chartList, withCartId(action.payload)];
    },
    // for multiple product
    addMultipleToChart: (state, action: PayloadAction<Products[]>) => {
      state.chartList = [...state.chartList, ...action.payload.map(withCartId)];
    },
    // for update
    updateChart: (state, action: PayloadAction<Partial<Products> & { productName: string; quantity: number }>) => {
      const { quantity, sellPrice, mode } = action.payload;
      const key = getCartItemKey(action.payload);
      const existingProduct = key ? state.chartList.find((product) => getCartItemKey(product) === key) : undefined;

      if (existingProduct) {
        let nextQuantity = existingProduct.quantity + quantity;
        if (
          quantity > 0 &&
          existingProduct.mode !== "return" &&
          existingProduct.oversellMode === "block" &&
          existingProduct.stock !== undefined
        ) {
          nextQuantity = Math.min(nextQuantity, existingProduct.stock);
        }

        if (nextQuantity <= 0) {
          state.chartList = state.chartList.filter((product) => getCartItemKey(product) !== key);
          return;
        }

        existingProduct.quantity = nextQuantity;
        if (existingProduct.stockShort && nextQuantity <= (existingProduct.stock ?? Infinity)) {
          existingProduct.stockShort = false;
        }
        existingProduct.mode = mode || existingProduct.mode || "sale";
        if (action.payload.returnReason) existingProduct.returnReason = action.payload.returnReason;
        if (sellPrice) {
          existingProduct.sellPrice = sellPrice;
        }
      } else if (quantity > 0) {
        const item: Products = {
          category: "special",
          size: "N/A",
          productCost: 0,
          stockAlert: 0,
          schoolName: "special",
          wholesalePrice: 0,
          images: [],
          ...action.payload,
          sellPrice: sellPrice || 0,
          mode: mode || "sale",
        };
        state.chartList.push(withCartId(item));
      }
    },

    removeItemChart: (state, action: PayloadAction<CartItemRef & { productName?: string }>) => {
      const key = getCartItemKey(action.payload);
      if (!key) return;
      state.chartList = state.chartList.filter((product) => getCartItemKey(product) !== key);
    },
    // Recalculate prices of items already in the cart when the price mode changes
    applyPriceMode: (state, action: PayloadAction<"retail" | "wholesale">) => {
      state.chartList.forEach((product) => {
        if (product.retailPrice === undefined || product.wholesalePrice === undefined) return;
        product.sellPrice = action.payload === "wholesale" ? product.wholesalePrice : product.retailPrice;
      });
    },
    // Refresh the stock snapshot of cart lines from a fresh product list. Quantities are never changed:
    // a line above the new stock is only flagged, so the cashier decides.
    syncCartStock: (state, action: PayloadAction<StockSource[]>) => {
      const byId = new Map<string, StockSource>();
      action.payload.forEach((product) => {
        if (product._id != null) byId.set(String(product._id), product);
      });
      state.chartList.forEach((line) => {
        if (line.mode === "return" || line.stock === undefined || line.productId == null) return;
        const product = byId.get(String(line.productId));
        if (!product || product.isBundle || typeof product.quantity !== "number") return;
        line.stock = Math.max(0, product.quantity);
        if (product.oversellMode) line.oversellMode = product.oversellMode;
        line.stockShort = line.oversellMode === "block" && line.quantity > line.stock;
      });
    },
    // Copies the saved returns of an invoice onto the matching sale lines in the cart (after a cancelled return).
    // Quantities and unsaved edits in the cart are not touched.
    setCartReturns: (state, action: PayloadAction<Products[]>) => {
      const claimed = new Set<number>();
      state.chartList.forEach((line) => {
        if (line.mode === "return") return;
        const key = lineMatchKey(line);
        if (!key) return;
        const index = action.payload.findIndex(
          (saved, i) => !claimed.has(i) && saved.mode !== "return" && lineMatchKey(saved) === key
        );
        if (index < 0) return;
        claimed.add(index);
        line.returns = action.payload[index].returns || [];
        line.returnedQty = computeReturnedQty(line);
      });
=======
      state.chartList = [...state.chartList, action.payload];
    },
    // for multiple product
    addMultipleToChart: (state, action: PayloadAction<Products[]>) => {
      state.chartList = [...state.chartList, ...action.payload];
    },
    // for update
    updateChart: (
      state,
      action: PayloadAction<{ productName: string; quantity: number; sellPrice?: number }>
    ) => {
      const { productName, quantity, sellPrice } = action.payload;
      const existingProduct = state.chartList.find((product) => product.productName === productName);

      if (existingProduct) {
        existingProduct.quantity = Math.max(0, existingProduct.quantity + quantity); // Prevent negative quantity
        if (sellPrice) {
          existingProduct.sellPrice = sellPrice; // Update price if provided
        }
      } else {
        state.chartList.push({
          productId: undefined,
          productName: productName,
          quantity: Math.max(0, quantity),
          sellPrice: sellPrice || 0,
          category: 'special',
          size: 'N/A',
          productCost: 0,
          stockAlert: 0,
        });
      }
    },

    removeItemChart: (state, action: PayloadAction<{ productName: string }>) => {
      const { productName } = action.payload;
      state.chartList = state.chartList.filter((product) => product.productName !== productName);
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    },
    handleReturnItemChart :(state, action: PayloadAction<{ productName: string,return:boolean }>) => {
      const { productName,return:isReturn } = action.payload;
      state.chartList = state.chartList.map((product) =>
        product.productName === productName
          ? { ...product, return: isReturn } 
          : product
      );
    },

    clearChart: (state) => {
      state.chartList = [];
    },
  },
});

// Invoice slice
const invoiceSlice = createSlice({
  name: "invoice",
  initialState: initialInvoiceState,
  reducers: {
    setInvoiceNumber: (state, action: PayloadAction<number>) => {
      state.invoiceNumber = action.payload;
    },
    setDiscount: (state, action: PayloadAction<number>) => {
      state.discount = action.payload;
    },
    
  },
});

// Mode slice (new slice for retail/wholesale mode)
const modeSlice = createSlice({
  name: "mode",
  initialState: "retail", // Default is 'retail' mode
  reducers: {
    toggleMode: (state) => {
      return state === "retail" ? "wholesale" : "retail";
    },
    setMode: (state, action: PayloadAction<"retail" | "wholesale">) => {
      return action.payload;
    },
  },
});

// Add to chart product
<<<<<<< HEAD
export const { addToChart, addMultipleToChart, updateChart, clearChart, removeItemChart, handleReturnItemChart, applyPriceMode, syncCartStock, setCartReturns } = chartSlice.actions;
=======
export const { addToChart, addMultipleToChart, updateChart, clearChart, removeItemChart,handleReturnItemChart } = chartSlice.actions;
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
// For mode like wholesaler or retailer
export const { toggleMode, setMode } = modeSlice.actions;
// For invoice number and discount
export const { setInvoiceNumber,  setDiscount } = invoiceSlice.actions;

// Configure the store
export const store = configureStore({
  reducer: {
    chart: chartSlice.reducer,
    mode: modeSlice.reducer, 
    invoice: invoiceSlice.reducer,
  },
});

// Hook for dispatching actions
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Hook for accessing state
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
