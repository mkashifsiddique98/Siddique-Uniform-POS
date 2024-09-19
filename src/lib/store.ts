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

const chartSlice = createSlice({
  name: "chart",
  initialState,
  reducers: {
    addToChart: (state, action: PayloadAction<Products>) => {
      state.chartList = [...state.chartList, action.payload];
    },

    updateChart: (
      state,
      action: PayloadAction<{ productName: string; quantity: number; sellPrice?: number }>
    ) => {
      const { productName, quantity, sellPrice } = action.payload;
      const existingProduct = state.chartList.find((product) => product.productName === productName);

      if (existingProduct) {
        // Update the quantity of the existing product
        existingProduct.quantity = Math.max(0, existingProduct.quantity + quantity); // Prevent negative quantity
        if (sellPrice) {
          existingProduct.sellPrice = sellPrice; // Update price if provided
        }
      } else {
        // If product doesn't exist, add it to the chartList
        state.chartList.push({
          productId: undefined,
          productName: productName,
          quantity: Math.max(0, quantity), // Ensure quantity is not negative
          sellPrice: sellPrice || 0, // Default sell price to 0 if not provided
          category: 'special', // Set category to 'special' or some default
          size: 'N/A', // Default size
          productCost: 0, // Default product cost
          stockAlert: 0, // Default stock alert
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

export const { addToChart, updateChart, clearChart, removeItemChart } = chartSlice.actions;

export const store = configureStore({
  reducer: {
    chart: chartSlice.reducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
