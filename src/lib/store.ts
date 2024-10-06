// store.ts
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { RootState } from "@/types"; // Define your RootState type in a separate file
import { ProductFormState } from "@/types/product";

export interface Products extends ProductFormState {
  productId: object | undefined;
  productName: string;
  quantity: number;
  sellPrice: number;
}

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
export const { addToChart, addMultipleToChart, updateChart, clearChart, removeItemChart } = chartSlice.actions;
// For mode like wholesaler or retailer
export const { toggleMode, setMode } = modeSlice.actions;
// For invoice number and discount
export const { setInvoiceNumber,  setDiscount } = invoiceSlice.actions;

// Configure the store
export const store = configureStore({
  reducer: {
    chart: chartSlice.reducer,
    mode: modeSlice.reducer, // Add the mode slice here
    invoice: invoiceSlice.reducer,
  },
});

// Hook for dispatching actions
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Hook for accessing state
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
