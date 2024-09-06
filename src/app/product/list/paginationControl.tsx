import React, { ChangeEvent, FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationControlProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages: Number;
}
export const PaginationControl: FC<PaginationControlProps> = ({
  hasNextPage,
  hasPrevPage,
  totalPages,
}) => {
  const route = useRouter();
  const searchParams = useSearchParams();
  const page = searchParams.get("page") ?? 1;
  const per_page = searchParams.get("per_page") ?? 5;
  const goToPage = (pageNumber: number) => {
    route.push(`/product/list/?page=${pageNumber}&per_page=${per_page}`);
  };
  const renderPageNumber = (pageNumber: number) => (
    <a
      key={pageNumber}
      href="#"
      onClick={() => goToPage(pageNumber)}
      className={`${
        Number(page) === pageNumber
          ? "bg-[#272e3f] text-white"
          : "text-gray-900 hover:bg-gray-50"
      }  px-4 py-2 text-sm font-semibold inline-flex items-center border focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600`}
    >
      {pageNumber}
    </a>
  );
  return (
    <div>
      <nav
        className="isolate inline-flex -space-x-px rounded-sm shadow-sm"
        aria-label="Pagination"
      >
        <button
          onClick={() => goToPage(Number(page) - 1)}
          disabled={!hasPrevPage}
          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm">Prev</span>
        </button>

        {/* Pagination Logic */}
        {Array.from({ length: Number(totalPages) }, (_, index) => {
          const pageNumber = index + 1;
          const total = Number(totalPages);
          const currentPage = Number(page);

          // Show the first 5 pages or the current page if it's past the first 5
          if (
            pageNumber <= 5 ||
            (pageNumber === currentPage && currentPage > 5)
          ) {
            return renderPageNumber(pageNumber);
          }

          // Show ellipsis if we're beyond page 5
          if (pageNumber === 6 && currentPage > 5 && total > 6) {
            return (
              <li key={`pagination-ellipsis-${pageNumber}`}>
                <span className="px-2">...</span>
              </li>
            );
          }

          // Show the next page if you're on page 6 or greater
          if (pageNumber === currentPage + 1 && currentPage >= 5) {
            return renderPageNumber(pageNumber);
          }

          // Show ellipsis before the last page if there are hidden pages
          if (pageNumber === total - 1 && currentPage + 1 < total - 1) {
            return (
              <li key={`pagination-ellipsis-end-${pageNumber}`}>
                <span className="px-3">...</span>
              </li>
            );
          }

          // Show the last page
          if (pageNumber === total) {
            return renderPageNumber(pageNumber);
          }

          return null; // Hide other pages
        })}

        <button
          disabled={!hasNextPage}
          onClick={() => goToPage(Number(page) + 1)}
          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed"
        >
          <span className="text-sm">Next</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
};

export const SelectPaginationOption = () => {
  const route = useRouter();
  const handleSelectChange = (selectedValue: string) => {
    const newRoute = `/product/list/?page=1&per_page=${selectedValue}`;
    route.push(newRoute);
  };

  return (
    <Select onValueChange={handleSelectChange}>
      <SelectTrigger className="w-20">
        <SelectValue placeholder="5" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Page</SelectLabel>
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="25">25</SelectItem>
          <SelectItem value="1000">All</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
