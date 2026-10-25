"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "./product-card";
import { FilterElementProps, ProductFormState } from "@/types/product";
import FilterBtnProduct from "./Filter-btn-product";
import { Search } from "@/components/custom-components/inputIcon";
import { cn } from "@/lib/utils";
import { School } from "@/types/school-name";
import { findStockConflicts, Products, store, syncCartStock, useAppDispatch } from "@/lib/store";
import { useStore } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import { useAutoStockRefresh } from "./useStockSync";
import { applyStockRows, StockRow } from "@/lib/stockMerge";

interface Props {
  schoolList: School[];
  items: ProductFormState[];
  perPage: number;
}

const ProductBox: React.FC<Props> = ({ schoolList, items: serverItems, perPage }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const reduxStore = useStore<ReturnType<typeof store.getState>>();

  // The server list, with stock updated in place between full page refreshes
  const [items, setItems] = useState(serverItems);
  const [lastServerItems, setLastServerItems] = useState(serverItems);
  if (serverItems !== lastServerItems) {
    setLastServerItems(serverItems);
    setItems(serverItems);
  }
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Returns false when products were added or removed, so the caller does a full refresh instead
  const applyStock = useCallback((rows: StockRow[]) => {
    const result = applyStockRows(itemsRef.current, rows);
    if (result.structureChanged) return false;
    if (result.items !== itemsRef.current) setItems(result.items);
    return true;
  }, []);

  // Multi-cashier freshness: stock-only refresh on tab focus and every 30s while visible
  useAutoStockRefresh(applyStock);

  // New items arrived (page load or a refresh): re-sync the cart's stock snapshots
  useEffect(() => {
    if (!items.length) return;
    const cart = reduxStore.getState().chart.chartList;
    const alreadyFlagged = new Set(
      cart
        .filter((line: Products) => line.stockShort)
        .map((line: Products) => `${line.productId}:${line.stock}`)
    );
    const conflicts = findStockConflicts(cart, items);
    dispatch(syncCartStock(items));
    conflicts.forEach(({ line, available }) => {
      // Warn once per change, not on every refresh
      if (alreadyFlagged.has(`${line.productId}:${available}`)) return;
      toast({
        variant: "destructive",
        title: "Stock changed",
        description: `Only ${available} left for ${line.productName}.`,
      });
    });
  }, [items, dispatch, toast, reduxStore]);

  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState(""); // Search
  // Feature
  const [filteredProducts, setFilteredProducts] = useState<ProductFormState[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterElement, setFilterElement] = useState<FilterElementProps>({
    filterBy: "",
    filterValue: "",
  });
  //   // suggestion timeout
  // const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateIndexRange = () => {
    const indexOfLastItem = currentPage * perPage;
    const indexOfFirstItem = indexOfLastItem - perPage;
    return { indexOfFirstItem, indexOfLastItem };
  };

  const { indexOfFirstItem, indexOfLastItem } = calculateIndexRange();

  // Combined filter for search and filter button; computed once per change, not on every render
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, "");
    const filterValue = filterElement.filterValue.toLowerCase().trim();
    return items.filter((item) => {
      const matchesSearch = query
        ? item.productName.toLowerCase().replace(/\s+/g, "").includes(normalizedQuery)
        : true;
      const matchesFilter = filterElement.filterValue
        ? item[filterElement.filterBy]?.toLowerCase().trim().includes(filterValue)
        : true;
      return matchesSearch && matchesFilter;
    });
  }, [items, query, filterElement]);
  const totalFilteredItems = filteredItems.length;

  const currentItems = useMemo(
    () => filteredItems.slice(indexOfFirstItem, indexOfLastItem),
    [filteredItems, indexOfFirstItem, indexOfLastItem]
  );

  const handlePaginationClick = (pageNumber: number) =>
    setCurrentPage(pageNumber);

  // Filter function
  const handleFilterChangeElement = (filterElement: FilterElementProps) => {
    setFilterElement(filterElement);
  };

  useEffect(() => {
    setCurrentPage(1); // Reset page when filter changes
  }, [filterElement]);
  // ***************************   Bar-Code *******************************

  // ************************************************************************

  const handleChangeQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setQuery(input);
    setCurrentPage(1);
    if (input.length > 0) {
      const filtered = currentItems.filter((item) =>
        item.productName
          .toLowerCase()
          .replace(/\s+/g, "")
          .includes(input.toLowerCase().replace(/\s+/g, ""))
      );
      setFilteredProducts(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredProducts([]);
      setShowSuggestions(false);
    }

    //   if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // // Set timeout to hide suggestions after 500ms of inactivity
    // typingTimeoutRef.current = setTimeout(() => {
    //   setShowSuggestions(false);
    // }, 500);
  };

  const handleSelect = (item: string) => {
    setQuery(item);
    setShowSuggestions(false);
  };

  return (
    <div className="my-4">
      <FilterBtnProduct
        schoolList={schoolList}
        filterElement={filterElement}
        handleFilterChangeElement={handleFilterChangeElement}
      />
      <Search
        className="w-full  focus-visible:ring-black focus-visible:ring-2"
        placeholder="Product Name or Product code"
        value={query}
        onBlur={() => {
          setTimeout(() => setShowSuggestions(false), 150); 
        }}
        onFocus={() => {
          if (filteredProducts.length > 0) setShowSuggestions(true);
        }}
        onChange={(e) => handleChangeQuery(e)}
      />
      {showSuggestions && filteredProducts.length > 0 && (
        <ul className="absolute z-10 mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
          {filteredProducts.map((item, index) => (
            <li
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSelect(item.productName)}
            >
              {item.productName}
            </li>
          ))}
        </ul>
      )}
      {/* Display current items */}
      <div className="m-2" style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 m-2 ">
          {currentItems.map((item, index) => (
            <ProductCard key={item._id ? String(item._id) : item.productName + index} product={item} />
          ))}
        </div>
      </div>
      {currentItems.length === 0 && (
        <div className="flex justify-center items-center h-[50vh] sm:h-[70vh]">
          <p className="text-lg font-extrabold">No Record Found!</p>
        </div>
      )}

      {currentItems.length >= 1 && (
        <nav
          aria-label="Pagination Navigation"
          className="flex flex-wrap justify-between items-center space-y-2 sm:space-y-0"
        >
          <ul className="inline-flex -space-x-px text-sm">
            {/* Previous Button */}
            <li>
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePaginationClick(currentPage - 1)}
                className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                aria-label="Previous Page"
              >
                &laquo; Previous
              </button>
            </li>

            {/* Pagination Numbers */}
            {(() => {
              const pages = [];
              const totalPages = Math.ceil(totalFilteredItems / perPage);

              // Always show the first five pages
              for (let i = 1; i <= Math.min(5, totalPages); i++) {
                pages.push(i);
              }

              // Show ellipsis if needed
              if (totalPages > 5) {
                if (currentPage > 6) {
                  pages.push("...");
                }

                // Show pages around the current page
                const startPage = Math.max(currentPage - 2, 6);
                const endPage = Math.min(currentPage + 2, totalPages - 5);

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }

                // Show ellipsis if needed
                if (totalPages > endPage + 1) {
                  pages.push("...");
                }

                // Always show the last five pages if not already included
                for (
                  let i = Math.max(totalPages - 4, endPage + 1);
                  i <= totalPages;
                  i++
                ) {
                  if (!pages.includes(i) && i !== "...") {
                    pages.push(i);
                  }
                }
              }

              return pages.map((page, index) => (
                <li key={`pagination-${page}`}>
                  {page === "..." ? (
                    <span className="px-3 text-gray-500 dark:text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePaginationClick(page)}
                      className={`flex items-center justify-center px-3 h-8 leading-tight font-bold border border-gray-300 dark:border-gray-700 ${
                        currentPage === page
                          ? "bg-gray-950 text-white dark:bg-gray-700 dark:text-white"
                          : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                      }`}
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  )}
                </li>
              ));
            })()}

            {/* Next Button */}
            <li>
              <button
                disabled={
                  currentPage >= Math.ceil(totalFilteredItems / perPage)
                }
                onClick={() => handlePaginationClick(currentPage + 1)}
                className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                aria-label="Next Page"
              >
                Next &raquo;
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default ProductBox;
