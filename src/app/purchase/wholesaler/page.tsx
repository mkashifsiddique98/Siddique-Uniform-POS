"use client";
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { IWholesaler } from "@/models/wholesaler";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BreadCrum from "@/components/custom-components/bread-crum";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// components/AddWholesalerForm.tsx
interface WholesalerFormProps {
  onAdd: () => void;
}

export const AddWholesalerForm: React.FC<WholesalerFormProps> = ({ onAdd }) => {
  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    paymentStatus: "Clear",
    pendingBalance: 0,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await axios.post("/api/purchase/wholesale", form);
    onAdd();
    setForm({
      name: "",
      location: "",
      phone: "",
      paymentStatus: "Clear",
      pendingBalance: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mx-6">
      <Input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        required
      />
      <Input
        name="location"
        value={form.location}
        onChange={handleChange}
        placeholder="Location"
        required
      />
      <Input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Phone"
        required
      />
      <Button type="submit">Add Wholesaler</Button>
    </form>
  );
};

// WholesalerList Component
type WholesalerData = {
  _id?: string;
  name: string;
  location: string;
  phone: string;
  paymentStatus: string;
  pendingBalance: number;
};

interface DataTableDemoProps {
  data: WholesalerData[];
  onDelete: (id: string) => void;
}

const columns: ColumnDef<WholesalerData>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => <div>{row.getValue("location")}</div>,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Phone
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("phone")}</div>,
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => <div>{row.getValue("paymentStatus")}</div>,
  },
  {
    accessorKey: "pendingBalance",
    header: "Pending Balance",
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.getValue("pendingBalance")}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const wholesaler = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(wholesaler.name)}
            >
              Copy Wholesaler Name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => table.options.meta?.onDelete(wholesaler._id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function WholesalerList({ data, onDelete }: DataTableDemoProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
   
   
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
    meta: {
      onDelete,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter..."
          value={(table.getColumn("phone")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("phone")?.setFilterValue(event.target.value)
          }
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
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

// MainWholesaler Component
const MainWholeSaler: React.FC = () => {
  const [wholesalers, setWholesalers] = useState<IWholesaler[]>([]);
  const [showlistAdd, setShowlistAdd] = useState<string>("list");

  const fetchWholesalers = async () => {
    try {
      const response = await axios.get("/api/purchase/wholesale");
      if (response) {
        setWholesalers(response.data.listWholeSaler);
      } else {
        setWholesalers([]);
      }
    } catch (error) {
      console.log("Message Error", error);
    }
  };

  useEffect(() => {
    fetchWholesalers();
  }, []);

  const ShowAdd = (option: string) => {
    setShowlistAdd(option);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete("/api/purchase/wholesale", { data: { id } });
      setWholesalers((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting wholesaler:", error);
    }
  };

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Purchase" subfolder="Whole Saler" />
      <div className="flex justify-end gap-2 mb-4">
        <Button
          onClick={() => ShowAdd("list")}
          className={`${
            showlistAdd == "list" ? "bg-green-500 hover:bg-green-500" : ""
          }`}
        >
          List of WholeSaler
        </Button>
        <Button
          onClick={() => ShowAdd("add")}
          className={`${
            showlistAdd == "add" ? "bg-green-500 hover:bg-green-500" : ""
          }`}
        >
          Add WholerSaler
        </Button>
      </div>
      {showlistAdd === "add" && <AddWholesalerForm onAdd={fetchWholesalers} />}
      {showlistAdd === "list" && (
        <WholesalerList data={wholesalers} onDelete={handleDelete} />
      )}
    </div>
  );
};

export default MainWholeSaler;
