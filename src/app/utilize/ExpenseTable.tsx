"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExpenseForm from "./FormExpense";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Utilize } from "@/types/utilize";



export default function ExpenseTable({
  refresh,
  data,
  setData,
  ITEMS_PER_PAGE = 7
}: {
  refresh: boolean;
  data: Utilize[];
  setData: React.Dispatch<React.SetStateAction<Utilize[]>>;
  ITEMS_PER_PAGE: number
}) {
  const [editItem, setEditItem] = useState<Utilize | null>(null);
  const { toast } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  // Calculate current page data slice
  const currentPageData = data.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this expense?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/utilize/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setData((prev) => prev.filter((d) => d._id !== id));

      toast({
        title: "Deleted",
        description: "Expense deleted successfully.",
      });

      // If current page becomes empty after deletion, go to previous page if possible
      if ((data.length - 1) <= (currentPage - 1) * ITEMS_PER_PAGE && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the expense.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = (item: Utilize) => {
    setEditItem(item);
  };

  const handleUpdated = () => {
    setEditItem(null);
    fetch("/api/utilize")
      .then((res) => res.json())
      .then(setData);
  };

  // Reset to page 1 when data or refresh changes (optional)
  useEffect(() => {
    setCurrentPage(1);
  }, [data, refresh]);

  return (
    <div className="mt-6 border rounded-xl">
      <Table>
        <TableHeader className=" font-bold">
          <TableRow>
           
            <TableHead>Date</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentPageData.map((item: Utilize,index) => (
            <TableRow key={item._id}>
              
              <TableCell>
                {new Date(item.createdAt).toLocaleDateString()}
              </TableCell>

              <TableCell>{item.title}</TableCell>
              <TableCell>{item.category?.name || "N/A"}</TableCell>
              <TableCell>RS {item.amount}</TableCell>
              <TableCell>{item.paymentMethod}</TableCell>
              <TableCell>{item.handledBy}</TableCell>
              <TableCell>{item.note}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdate(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item._id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {currentPageData.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                No expenses found.
              </TableCell>
            </TableRow>
          )}

        </TableBody>
      </Table>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </Button>

          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              variant={currentPage === i + 1 ? "default" : "outline"}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm onAdd={handleUpdated} initialData={editItem} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
