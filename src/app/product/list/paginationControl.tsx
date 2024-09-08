import React, { FC } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
  totalPages: number;
}

export const PaginationControl: FC<PaginationControlProps> = ({
  hasNextPage,
  hasPrevPage,
  totalPages,
}) => {
  const route = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const per_page = searchParams.get("per_page") ?? 5;

  const goToPage = (pageNumber: number) => {
    route.push(`/product/list/?page=${pageNumber}&per_page=${per_page}`);
  };

  const renderPageNumber = (pageNumber: number) => (
    <a
      key={pageNumber}
      href="#"
      onClick={(e) => {
        e.preventDefault();
        goToPage(pageNumber);
      }}
      className={`${
        page === pageNumber
          ? "bg-[#272e3f] text-white"
          : "text-gray-900 hover:bg-gray-50"
      } px-4 py-2 text-sm font-semibold inline-flex items-center border focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600`}
    >
      {pageNumber}
    </a>
  );

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div>
      <nav
        className="isolate inline-flex -space-x-px rounded-sm shadow-sm"
        aria-label="Pagination"
      >
        <button
          onClick={() => goToPage(page - 1)}
          disabled={!hasPrevPage}
          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm">Prev</span>
        </button>

        {/* Pagination Logic */}
        {pages.map((pageNumber) => {
          if (pageNumber <= 5 || pageNumber === page || pageNumber === totalPages) {
            return renderPageNumber(pageNumber);
          }
          if (
            (pageNumber === 6 && page > 5 && totalPages > 6) ||
            (pageNumber === totalPages - 1 && page + 1 < totalPages - 1)
          ) {
            return (
              <li key={`pagination-ellipsis-${pageNumber}`} >
                <span className="px-3">...</span>
              </li>
            );
          }
          return null;
        })}

        <button
          disabled={!hasNextPage}
          onClick={() => goToPage(page + 1)}
          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed"
        >
          <span className="text-sm">Next</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
};

export const SelectPaginationOption: FC = () => {
  const route = useRouter();

  const handleSelectChange = (selectedValue: string) => {
    route.push(`/product/list/?page=1&per_page=${selectedValue}`);
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
