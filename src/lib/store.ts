// store.ts
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { RootState } from "@/types"; // Define your RootState type in a separate file
export interface Products {
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
      action: PayloadAction<{ productName: string; quantity: number }>
    ) => {
      const { productName, quantity } = action.payload;
      const updatedChartList = state.chartList.map((product) => {
        if (product.productName === productName) {
          // Update the quantity of the existing product by creating a new object
          return { ...product, quantity: product.quantity + quantity };
        }
        return product;
      });
      // Use the spread operator to flatten the array when updating the state
      state.chartList = [...updatedChartList];
    },
    removeItemChart: (state, action: PayloadAction<{ productName: string }>) => {
      const { productName } = action.payload;
      state.chartList = state.chartList.filter((product) => product.productName !== productName);
    },
    
    clearChart: (state) => {
      return {
        ...state,
        chartList: [],
      };
    },
  },
});

export const { addToChart, updateChart, clearChart , removeItemChart} = chartSlice.actions;

export const store = configureStore({
  reducer: {
    chart: chartSlice.reducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;
