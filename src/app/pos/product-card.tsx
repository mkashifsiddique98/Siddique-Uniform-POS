import Image from "next/image";
import React, { FC, useEffect, useState } from "react";
import {
  Products,
  addToChart,
  getCartItemKey,
  store,
  updateChart,
  useAppDispatch,
  useTypedSelector,
} from "@/lib/store";
import { useStore } from "react-redux";
import { toast } from "@/components/ui/use-toast";
import { ProductFormState } from "@/types/product";

interface ProductCardProps {
  product: ProductFormState;
}

// Bundle component names rarely change: look each one up once per page load and share the request
const componentNameCache = new Map<string, Promise<string | undefined>>();

function getComponentName(id: string): Promise<string | undefined> {
  let pending = componentNameCache.get(id);
  if (!pending) {
    pending = fetch(`/api/product/${id}`)
      .then((res) => res.json())
      .then(({ response }) => (response && response.productName ? String(response.productName) : undefined))
      .catch((err) => {
        componentNameCache.delete(id);
        console.error("Error fetching subproduct:", err);
        return undefined;
      });
    componentNameCache.set(id, pending);
  }
  return pending;
}

const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const dispatch = useAppDispatch();
  const reduxStore = useStore<ReturnType<typeof store.getState>>();
  const mode = useTypedSelector((state) => state.mode); // "retail" | "wholesale"

  const [subProductNames, setSubProductNames] = useState<
    Record<string, string>
  >({});

  const getSellPrice = (p: ProductFormState) =>
    mode === "wholesale" ? p.wholesalePrice : p.sellPrice;

  const addOrUpdateToChart = (p: ProductFormState) => {
    // Read the cart when clicked, so the card does not re-render on every cart change
    const chartList = reduxStore.getState().chart.chartList;
    const exists = chartList.find(
      (item: Products) => p._id && getCartItemKey(item) === String(p._id)
    );
    const stock = p.isBundle ? undefined : Math.max(0, Number(p.quantity ?? 0));
    const currentQty = exists?.quantity ?? 0;

    // Only "block" products are capped by stock. In "clamp" mode a sale may go beyond stock;
    // the server takes what is there and records the rest as sold beyond stock.
    if (p.oversellMode === "block" && stock !== undefined && currentQty + 1 > stock) {
      toast({
        variant: "destructive",
        title: "Not enough stock",
        description: `Only ${stock} piece(s) of ${p.productName} available.`,
      });
      return;
    }

    if (exists) {
      dispatch(
        updateChart({
          productId: p._id,
          productName: p.productName,
          quantity: 1,
        })
      );
    } else {
      dispatch(
        addToChart({
          productId: p._id,
          productName: p.productName,
          sellPrice: getSellPrice(p),
          retailPrice: p.sellPrice,
          stock,
          oversellMode: p.oversellMode,
          quantity: 1,
          schoolName: p.schoolName,
          category: p.category,
          stockAlert: p.stockAlert,
          size: p.size,
          wholesalePrice: p.wholesalePrice,
          productCost: p.productCost,
          components: p.components,
          isBundle: p.isBundle,
          images: []
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
  // Bundles have no stock of their own
  const stockQty = Math.max(0, Number(product.quantity ?? 0));
  const outOfStock = !product.isBundle && stockQty <= 0;
  // Only "block" products cannot be added when out of stock
  const addDisabled = outOfStock && product.oversellMode === "block";
  const lowStock =
    !product.isBundle && !outOfStock && Number(product.stockAlert) > 0 && stockQty <= Number(product.stockAlert);
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
          {product.isBundle ? product.quantity : stockQty} pcs
        </span>
        {(outOfStock || lowStock) && (
          <span
            className={`absolute top-5 right-2 text-white text-[10px] px-2 py-0.5 rounded ${
              outOfStock ? "bg-red-600" : "bg-amber-500"
            }`}
          >
            {outOfStock ? "Out of stock" : "Low stock"}
          </span>
        )}
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
  // A stable string key: the components array gets a new reference on every stock refresh
  const componentsKey = product.isBundle ? (product.components ?? []).map(String).join(",") : "";
  useEffect(() => {
    if (!componentsKey) return;
    let cancelled = false;
    Promise.all(componentsKey.split(",").map(async (id) => [id, await getComponentName(id)] as const)).then(
      (pairs) => {
        if (cancelled) return;
        const newNames: Record<string, string> = {};
        pairs.forEach(([id, name]) => {
          if (name) newNames[id] = name;
        });
        setSubProductNames(newNames);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [componentsKey]);
  return (
    <div className="w-32 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col justify-between">
      <div
        onClick={addDisabled ? undefined : handleMainClick}
        aria-disabled={addDisabled}
        className={`group border hover:border-black rounded-t-md ${
          addDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
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

export default React.memo(ProductCard);
