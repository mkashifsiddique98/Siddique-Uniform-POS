import Image from "next/image";
import React, { FC, useEffect, useState } from "react";
import {
  Products,
  addToChart,
  updateChart,
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";
import { ProductFormState } from "@/types/product";

interface ProductCardProps {
  product: ProductFormState;
}

const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const dispatch = useAppDispatch();
  const chartList = useTypedSelector((state) => state.chart.chartList);
  const mode = useTypedSelector((state) => state.mode); // "retail" | "wholesale"

  const [subProductNames, setSubProductNames] = useState<
    Record<string, string>
  >({});

  const getSellPrice = (p: ProductFormState) =>
    mode === "wholesale" ? p.wholesalePrice : p.sellPrice;

  const addOrUpdateToChart = (p: ProductFormState) => {
    const exists = chartList.find(
      (item: { productName: string }) => item.productName === p.productName
    );
    if (exists) {
      dispatch(updateChart({ productName: p.productName, quantity: 1 }));
    } else {
      dispatch(
        addToChart({
          productId: p._id,
          productName: p.productName,
          sellPrice: getSellPrice(p),
          quantity: 1,
          schoolName: p.schoolName,
          category: p.category,
          stockAlert: p.stockAlert,
          size: p.size,
          wholesalePrice: p.wholesalePrice,
          productCost: p.productCost,
          components:p.components,
          isBundle:p.isBundle
        })
      );
    }
  };

  const handleMainClick = () => {
    addOrUpdateToChart(product);
  };

  const handleSubProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/product/${productId}`);
      const { response: subProduct } = await res.json();

      if (!subProduct || !subProduct.productName) return;

      // Store name locally to avoid re-fetching
      setSubProductNames((prev) => ({
        ...prev,
        [productId]: subProduct.productName,
      }));

      addOrUpdateToChart(subProduct);
    } catch (err) {
      console.error("Failed to fetch sub-product:", err);
    }
  };
  const imageSrc =
  Array.isArray(product?.images) && product.images.length > 0
    ? product.images[0]
    : "/product/no-image-product.jpg";
  const ProductDetails = (
    <>
      <div className="relative">
        <Image
          className="w-full h-[80px] object-cover rounded-t-md"
          width={180}
          height={80}
          alt="product"
          src={imageSrc}
        />
        <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-0.5 rounded">
          {product.quantity} pcs
        </span>
      </div>

      <div className="p-2 text-sm flex flex-col gap-1">
        <p className="font-semibold truncate capitalize">
          {product.productName}
        </p>
        <p className="capitalize text-gray-600 text-xs">{product.category}</p>
        <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded w-fit">
          Rs {getSellPrice(product)}
        </span>
      </div>
    </>
  );
  useEffect(() => {
    const fetchAllSubProductNames = async () => {
      if (!product.isBundle || !product.components?.length) return;

      const newNames: Record<string, string> = {};

      for (const componentId of product.components) {
        try {
          const res = await fetch(`/api/product/${componentId}`);
          const { response } = await res.json();

          if (response && response.productName) {
            newNames[componentId] = response.productName;
          }
        } catch (err) {
          console.error("Error fetching subproduct:", err);
        }
      }

      setSubProductNames(newNames);
    };

    fetchAllSubProductNames();
  }, [product.components, product.isBundle]);
  return (
    <div className="w-32 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col justify-between">
      <div
        onClick={handleMainClick}
        className="group border hover:border-black rounded-t-md"
      >
        {ProductDetails}
      </div>

      {/* Show subproducts if bundle */}
      {product.isBundle && 
        product.components?.map((componentId, index) => {
          const isLast = index === product.components.length - 1;
          return (
            <button
              key={`${componentId}-${index}`}
              onClick={() => handleSubProduct(componentId)}
              className={`bg-black text-white text-[10px] font-medium w-full px-4 py-1 
                    border border-transparent text-bold
                    hover:bg-transparent hover:text-black hover:border-black 
                    transition-all duration-200 
                    ${isLast ? "rounded-b-md" : ""}`}
            >
              {subProductNames[componentId] || `Loading...`}
            </button>
          );
        })}
    </div>
  );
};

export default ProductCard;
