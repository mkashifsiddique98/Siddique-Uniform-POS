import {
  Products,
  addToChart,
  updateChart,
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";
import { ProductFormState } from "@/types/product";
import Image from "next/image";
import React, { FC, useState } from "react";
interface ProductCardProps {
  product: ProductFormState;
}
const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const chartList: Products[] = useTypedSelector(
    (state) => state.chart.chartList
  );
  const dispatch = useAppDispatch();
  const mode = useTypedSelector((state) => state.mode); // mode
  const handleAddToChart = () => {
    const existingProductIndex = chartList.findIndex(
      (p) => p.productName === product.productName
    );

    if (existingProductIndex !== -1) {
      dispatch(updateChart({ productName: product.productName, quantity: 1 }));
    } else {
      // Mode of sale is  being manged
      const newProduct = {
        productId: product._id,
        productName: product.productName,
        sellPrice:
          mode === "wholesale" ? product.wholesalePrice : product.sellPrice,
        quantity: 1,
      };
      dispatch(addToChart(newProduct));
    }
  };

  return (
    <div
      className="h-44 w-32 border hover:border-black cursor-pointer shadow rounded-lg overflow-hidden"
      onClick={handleAddToChart}
    >
      <div className="relative">
        <Image
          priority={false}
          className="rounded-t-lg"
          width={180}
          height={14}
          alt="product"
          src="/product/no-image-product.jpg"
        />
        <p className="absolute top-2 left-4 bg-black text-white text-sm rounded-md px-3 py-1">
          {product?.quantity}&nbsp;pcs
        </p>
      </div>
      <div className="ml-3 text-sm whitespace-nowrap gap-2 flex flex-col">
        <p className="text-[13px] font-bold w-36 truncate capitalize">
          {product?.productName}
        </p>
        <p className="capitalize">{product?.category}</p>
        {/* Code */}
        {mode === "retail" && (
          <p className="bg-black text-white text-[10px] rounded-md w-16 px-3">
            Rs {product?.sellPrice}
          </p>
        )}
        {mode === "wholesale" && (
          <p className="bg-black text-white text-[10px] rounded-md w-16 px-3">
            Rs {product?.wholesalePrice}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
