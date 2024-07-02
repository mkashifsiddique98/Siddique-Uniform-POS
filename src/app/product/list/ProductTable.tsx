"use client";
import React, { useState, useEffect } from "react";
import {
  BadgePlus,
  ChevronDown,
  FileText,
  Sheet,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnFiltersState,
  OnChangeFn,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ProductFormState as Product } from "@/types/product";
import { columns } from "./TableColumns";
import { SelectPaginationOption, PaginationControl } from "./paginationControl";
import {
  generatePDF,
  generateExcel,
  handleBulkRowDataFn,
  getAllProductDetail,
} from "./useProduct";
import { useRouter, usePathname } from "next/navigation";
import ImportProductModal from "./ImportProductModel";
import DeleteConfirmModel from "./DeleteConfirmModel";
import { toast } from "@/components/ui/use-toast";

export default function AllProductTable({
  AllProductData,
  hasPrevPage,
  hasNextPage,
  totalPages,
}: {
  AllProductData: Product[];
  hasPrevPage: boolean;
  hasNextPage: boolean;
  totalPages: Number;
}) {
  const route = useRouter();
  
  const [data, setData] = useState<Product[]>(AllProductData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const table = useReactTable({
    data,
    columns,
    
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });


  useEffect(() => {
    setData(AllProductData);
  }, [AllProductData]);
  useEffect(() => {
    const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (
      selectedRowIds
    ) => {
      const selectedIds = Object.keys(selectedRowIds).filter(
        (id) => selectedRowIds[id] 
      );
      setSelectedRows(selectedIds);
    };
    handleRowSelectionChange(rowSelection);
  }, [rowSelection]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    table.getColumn("productName")?.setFilterValue(event.target.value);
  };
  const handleDeleteRows = async () => {
    const arrayOfIntegers = selectedRows.map((str) => parseInt(str, 10));
    const deleteRows = data.filter(
      (_, index) => !arrayOfIntegers.includes(index)
    );
    const itemsToDeleteFromDatabase = data.filter((_, index) =>
      arrayOfIntegers.includes(index)
    );
    const respose = await handleBulkRowDataFn(itemsToDeleteFromDatabase);
    if (respose?.ok) {
      toast({
        title: "Product Detele",
        description: "All products have been successfully deleted.",
      
      });
      
      setData(deleteRows); // main data
      setSelectedRows([]); // hide delete button
      setRowSelection({}); // clear detete Element
    
      
    } else {
      toast({
        variant: "destructive",
        title: "Server Error",
        description: "Please Check your Server or Restart you Application",
      });
    }
  };
  const handleCancelDeleteRowSelection = () => {
    setSelectedRows([]); // hide delete button
    setRowSelection({}); // clear detete Element
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder={"Filter productName..."}
          value={
            (table.getColumn("productName")?.getFilterValue() as string) ?? ""
          }
          onChange={handleFilterChange}
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex justify-end gap-4 m-2">
          <Button
            className=" hover:bg-blue-500 hover:text-white"
            variant="outline"
          >
            <SlidersHorizontal size={14} /> &nbsp; Filter
          </Button>
          <Button
            className=" hover:bg-red-500 hover:text-white"
            variant="outline"
            onClick={() => generatePDF(data)}
          >
            <FileText size={14} />
            &nbsp; PDF
          </Button>
          <Button
            className=" hover:bg-green-600 hover:text-white"
            variant="outline"
            onClick={() => generateExcel(data)}
          >
            <Sheet size={14} />
            &nbsp; Excel
          </Button>
          <ImportProductModal />
          <Button onClick={() => route.push("/product/create")}>
            <BadgePlus size={14} />
            &nbsp;Create
          </Button>
        </div>
      </div>

      <div className="rounded-md">
        <div className="m-2 mr-4 flex justify-end">
          {selectedRows.length > 0 && (
            // Delete Button
            <DeleteConfirmModel
              selectedNumberOfRow={Object.keys(rowSelection).length}
              handleDeleteRows={handleDeleteRows}
              handleCancelDeleteRowSelection={handleCancelDeleteRowSelection}
            />
          )}
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex  justify-between my-2">
        <div className="inline-flex text-sm text-muted-foreground justify-center items-center">
          Rows per Page: &nbsp;&nbsp;
          <SelectPaginationOption />
        </div>
        <PaginationControl
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
