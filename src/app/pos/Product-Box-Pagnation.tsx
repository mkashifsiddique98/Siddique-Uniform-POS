"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "./product-card";
import { FilterElementProps, ProductFormState } from "@/types/product";
import FilterBtnProduct from "./Filter-btn-product";
import { Search } from "@/components/custom-components/inputIcon";
import { cn } from "@/lib/utils";
import { School } from "@/types/school-name";

interface Props {
  schoolList: School[];
  items: ProductFormState[];
  perPage: number;
}

const ProductBox: React.FC<Props> = ({ schoolList, items, perPage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState(""); // Search
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
      ? item.productName.toLowerCase().trim().includes(query.toLowerCase().trim())
      : true;

    const matchesFilter = filterElement.filterValue
      ? item[filterElement.filterBy]?.toLowerCase().trim().includes(filterElement.filterValue.toLowerCase().trim())
      : true;

    return matchesSearch && matchesFilter;
  };

  const filteredItems = items.filter(combinedFilter);
  const totalFilteredItems = filteredItems.length;

  const currentItems = items
    .filter(combinedFilter)
    .slice(indexOfFirstItem, indexOfLastItem);

  const handlePaginationClick = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleChangeQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setCurrentPage(1); // Reset page when search query changes
  };

  // Filter function
  const handleFilterChangeElement = (filterElement: FilterElementProps) => {
    setFilterElement(filterElement);
  };

  useEffect(() => {
    setCurrentPage(1); // Reset page when filter changes
  }, [filterElement]);

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
        onChange={(e) => handleChangeQuery(e)}
      />
      {/* Display current items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 m-2 ">
        {currentItems.map((item, index) => (
          <ProductCard key={item.productName + index} product={item} />
        ))}
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
                for (let i = Math.max(totalPages - 4, endPage + 1); i <= totalPages; i++) {
                  if (!pages.includes(i) && i !== "...") {
                    pages.push(i);
                  }
                }
              }

              return pages.map((page, index) => (
                <li key={`pagination-${page}`}>
                  {page === "..." ? (
                    <span className="px-3 text-gray-500 dark:text-gray-400">...</span>
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
               
                disabled={currentPage >= Math.ceil(totalFilteredItems / perPage)}
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
