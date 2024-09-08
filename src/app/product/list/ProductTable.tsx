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
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,

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
} from "./useProduct";
import { useRouter } from "next/navigation";
import ImportProductModal from "./ImportProductModel";
import DeleteConfirmModel from "./DeleteConfirmModel";
import { toast } from "@/components/ui/use-toast";
import { DeteleBtnSingleRowModal } from "./TableColumns";
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
  const router = useRouter();
  
  const [data, setData] = useState<Product[]>(AllProductData);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  useEffect(() => {
    setData(AllProductData);
  }, [AllProductData]);

  useEffect(() => {
    const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id]
    );
    setSelectedRows(selectedIds);
  }, [rowSelection]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    table.getColumn("productName")?.setFilterValue(event.target.value);
  };

  const handleDeleteRows = async () => {
    const indicesToDelete = selectedRows.map((id) => parseInt(id, 10));
    const rowsToDelete = data.filter((_, index) => indicesToDelete.includes(index));
    const remainingRows = data.filter((_, index) => !indicesToDelete.includes(index));

    const response = await handleBulkRowDataFn(rowsToDelete);
    if (response?.ok) {
      toast({
        title: "Product Deleted",
        description: "All selected products have been successfully deleted.",
      });
      setData(remainingRows);
      setSelectedRows([]);
      setRowSelection({});
    } else {
      toast({
        variant: "destructive",
        title: "Server Error",
        description: "Please check your server or restart your application.",
      });
    }
  };
  const handleDeleteProduct = (productId: string | object | undefined) => {
    setData((prevData) => prevData.filter((product) => product?._id !== productId));
  };
  const handleCancelDeleteRowSelection = () => {
    setSelectedRows([]);
    setRowSelection({});
  };

  return (
    <div 
    className="w-full"
    >
      {/* Top Button and Search and Excel thing */}
      <div className="flex items-center py-4 justify-between">
        <Input
          placeholder="Filter by product name..."
          value={table.getColumn("productName")?.getFilterValue() as string || ""}
          onChange={handleFilterChange}
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Show Cols <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex justify-end gap-4 m-2">
          <Button
            className="hover:bg-red-500 hover:text-white"
            variant="outline"
            onClick={() => generatePDF(data)}
          >
            <FileText size={14} /> &nbsp; PDF
          </Button>
          <Button
            className="hover:bg-green-600 hover:text-white"
            variant="outline"
            onClick={() => generateExcel(data)}
          >
            <Sheet size={14} /> &nbsp; Excel
          </Button>
          <ImportProductModal />
          <Button onClick={() => router.push("/product/create")}>
            <BadgePlus size={14} /> &nbsp; Create
          </Button>
        </div>
      </div>

      <div className="rounded-md">
        {selectedRows.length > 0 && (
          <div className="m-2 mr-4 flex justify-end">
            <DeleteConfirmModel
              selectedNumberOfRow={Object.keys(rowSelection).length}
              handleDeleteRows={handleDeleteRows}
              handleCancelDeleteRowSelection={handleCancelDeleteRowSelection}
            />
          </div>
        )}

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  <TableCell style={{display:"none"}}>
                <DeteleBtnSingleRowModal
                  productId={row.original._id}
                  onDelete={() => handleDeleteProduct(row.original._id)}
                />
              </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  {/* Footer of the page */}
      <div className="flex justify-between my-2">
        <div className="inline-flex text-sm text-muted-foreground items-center">
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
