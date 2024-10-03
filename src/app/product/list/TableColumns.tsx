import Link from "next/link";
import { useState, FC } from "react";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ViewIcon, Edit2Icon, BadgeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllProductDetail, handleSingleRowDataFn } from "./useProduct";
import { ProductFormState as Product } from "@/types/product";
import { usePathname, useRouter } from "next/navigation";

interface DeteleBtnSingleRowModalProps {
  productId: object | undefined;
  onDelete?: ()=>void;
}
export const DeteleBtnSingleRowModal: FC<DeteleBtnSingleRowModalProps> = ({
  productId,
  onDelete
}) => {
  const route = useRouter();
  const pathName = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Modal toggle */}
      <div onClick={showModal}>
        <BadgeX />
      </div>

      {/* Main modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={hideModal}
        >
          <div className="relative bg-white rounded-lg shadow-md dark:bg-gray-700">
            <div className="my-2 p-4 ">
              <h1 className="text-left font-medium text-black text-lg capitalize">
                Do you want to delete Product ?
              </h1>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between p-2 md:p-4 border-t border-gray-200 rounded-b dark:border-gray-600">
              <Button
                variant="destructive"
                className="rounded"
                onClick={async (e) => {
                  const response = await handleSingleRowDataFn(productId);
                  if (response) {
                  
                    route.push(pathName)
                    toast({
                      description: `Product deleted!`,
                    });
                  }
                }}
              >
                Yes, delete
              </Button>
              <Button
                onClick={hideModal}
                className="ms-3 text-gray-500 bg-white hover:bg-red-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5  focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        content="-"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
      
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.index+1}</div>
    ),
  },
  {
    accessorKey: "productName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("productName")}</div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("category")}</div>
    ),
  },
  {
    accessorKey: "sellPrice",
    header: "Sale Price",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("sellPrice")}</div>
    ),
  },
  {
    accessorKey: "productCost",
    header: "Product Cost",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("productCost")}</div>
    ),
  },
  {
    accessorKey: "wholesalePrice",
    header: "wholesale Price",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("wholesalePrice")}</div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "quantity",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("quantity")}</div>
    ),
  },
  {
    id: "actions",
    accessorKey: "action",
    header: "Action",
    enableHiding: false,
    cell: ({ row }) => {
      const product: Product = row.original;

      return (
        <div className="flex space-x-1 cursor-pointer">
          <Link href={`/product/view/${product._id}`}>
          <div className="group flex relative hover:bg-gray-100 p-1 rounded-full">
            <ViewIcon />
            <span
              className="group-hover:opacity-100 transition-opacity bg-gray-800 px-2 text-sm text-gray-100 rounded-md absolute left-1/2 
      -translate-x-1/3  opacity-0 m-4 mx-auto
      -translate-y-[200%]
      "
            >
              View
            </span>
          </div>
          </Link>
          <Link href={`/product/edit/${product._id}`}>
            <div className="group flex relative hover:bg-gray-100 p-1 ">
              <Edit2Icon />
              <span
                className="group-hover:opacity-100 transition-opacity bg-gray-800 px-2 text-sm text-gray-100  absolute left-1/2 
      -translate-x-1/3  opacity-0 m-4 mx-auto
      -translate-y-[200%]
      "
              >
                Edit
              </span>
            </div>
          </Link>
          {/* In Future If we want this then we use Redux or Context managment Libray */}
          <div className="group flex relative text-red-500 hover:bg-red-500 hover:text-white  p-1 rounded-full">
            <DeteleBtnSingleRowModal productId={product._id} />
            <span
              className="group-hover:opacity-100 transition-opacity bg-gray-800 px-2 text-sm text-gray-100 rounded-md absolute left-1/2 
                  -translate-x-1/3  opacity-0 m-4 mx-auto
                  -translate-y-[200%]"
            >
              Delete
            </span>
          </div>
        </div>
      );
    },
  },
];
