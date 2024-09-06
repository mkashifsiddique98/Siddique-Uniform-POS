"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "./product-card";
import { FilterElementProps, ProductFormState } from "@/types/product";
import FilterBtnProduct from "./Filter-btn-product";
import { Search } from "@/components/custom-components/inputIcon";
import { cn } from "@/lib/utils";

interface Props {
  items: ProductFormState[];
  perPage: number;
}

const ProductBox: React.FC<Props> = ({ items, perPage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState(""); //Search
  const [filterElement, setFilterElement] = useState<FilterElementProps>({
    filterBy: "",
    filterValue: "",
  });
  const calculateIndexRange = () => {
    const indexOfLastItem = currentPage * perPage;
    const indexOfFirstItem = indexOfLastItem - perPage;
    return { indexOfFirstItem, indexOfLastItem };
  };

  const { indexOfFirstItem, indexOfLastItem } = calculateIndexRange();
  // Combined filter function for search and filter
  const combinedFilter = (item: ProductFormState) => {
    const matchesSearch = query
      ? item.productName
          .toLowerCase()
          .trim()
          .includes(query.toLowerCase().trim())
      : true;

    const matchesFilter = filterElement.filterValue
      ? item[filterElement.filterBy]
          .toLowerCase()
          .trim()
          .includes(filterElement.filterValue.toLowerCase().trim())
      : true;

    return matchesSearch && matchesFilter;
  };
  const filteredItems = items.filter(combinedFilter);

  const totalFilteredItems = filteredItems.length;
  const currentItems = items
    .filter(combinedFilter)
    .slice(indexOfFirstItem, indexOfLastItem);
  const handlePaginationClick = (pageNumber: number) =>
    setCurrentPage(pageNumber);

  const handleChangeQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setCurrentPage(1); // Reset page when search query changes
  };
  //filter fn
  const handleFilterChangeElement = (filterElement: FilterElementProps) => {
    setFilterElement(filterElement);
  };
  useEffect(() => {
    setCurrentPage(1); // Reset page when filter changes
  }, [filterElement]);

  return (
    <div className="my-4">
      <FilterBtnProduct
        filterElement={filterElement}
        handleFilterChangeElement={handleFilterChangeElement}
      />
      <Search
        className="focus-visible:ring-black focus-visible:ring-2"
        placeholder="Product Name or Product code"
        value={query}
        onChange={(e) => handleChangeQuery(e)}
      />
      {/* Display current items */}
      <div className="grid grid-cols-4 grid-rows-2 gap-4 m-2">
        {currentItems.map((item, index) => (
          <ProductCard key={item.productName + index} product={item} />
        ))}
      </div>
      {currentItems.length === 0 && (
        <div className="flex justify-center items-center h-[70vh]">
          <p className="text-lg font-extrabold">No Record Found!</p>
        </div>
      )}
      {currentItems.length >= 1 && (
        <div className="flex justify-between items-center">
          <nav
            aria-label="Page nsa avigation"
            className="flex justify-between items-center"
          >
            <ul className="inline-flex -space-x-px text-sm">
              <li>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => handlePaginationClick(currentPage - 1)}
                  className="flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:cursor-not-allowed"
                >
                  Previous
                </button>
              </li>
              {Array.from(
                { length: Math.ceil(totalFilteredItems / perPage) },
                (_, index) => {
                  const pageNumber = index + 1;
                  const totalPages = Math.ceil(totalFilteredItems / perPage);
                  const isNearStart = pageNumber <= 5;
                  const isNearEnd = pageNumber >= totalPages - 4;
                  const isCurrentPage = currentPage === pageNumber;

                  // Show the first 5 pages, the current page, and the last page
                  if (isNearStart || isNearEnd || isCurrentPage) {
                    return (
                      <li key={`pagination-${pageNumber}`}>
                        <button
                          onClick={() => handlePaginationClick(pageNumber)}
                          className={cn(
                            "flex items-center justify-center px-3 h-8 leading-tight font-bold text-gray-500 bg-white border border-gray-300 hover:bg-gray-950 hover:text-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
                            {
                              "bg-gray-950 text-white":
                                currentPage === pageNumber,
                            }
                          )}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  }

                  // Show ellipsis if it's in the middle (between start and end)
                  if (pageNumber === 3 || pageNumber === totalPages - 10) {
                    return (
                      <li key={`pagination-ellipsis-${pageNumber}`}>
                        <span className="px-3">...</span>
                      </li>
                    );
                  }

                  return null; // Don't render anything if the number is hidden
                }
              )}

              <li>
                <button
                  disabled={
                    currentPage >= Math.ceil(totalFilteredItems / perPage)
                  }
                  onClick={() => handlePaginationClick(currentPage + 1)}
                  className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
          {/* Showing Result and Toatal Data  */}
          {/* <div className="font-extrabold ">
            <p>
              Showing {currentPage} to {currentItems.length} of {items.length}{" "}
              results
            </p>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default ProductBox;
