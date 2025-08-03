"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Category {
  _id: string;
  name: string;
}

export default function ExpenseCategoriesForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true); // New loading for fetch categories
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");

  const { toast } = useToast();

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/utilize/expense-categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
    setLoadingCategories(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/utilize/expense-categories", {
        method: "POST",
        body: JSON.stringify({ name: newCat }),
      });

      if (res.ok) {
        toast({ title: "Category Added", description: newCat });
        setNewCat("");
        loadCategories();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Add failed",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const deleteCategory = async (id: string) => {
    try {
      await fetch(`/api/utilize/expense-categories/${id}`, { method: "DELETE" });
      toast({ title: "Deleted" });
      loadCategories();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const updateCategory = async () => {
    if (!editing || !editName.trim()) return;

    try {
      const res = await fetch(`/api/utilize/expense-categories/${editing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });

      if (res.ok) {
        toast({ title: "Updated" });
        setEditing(null);
        setEditName("");
        loadCategories();
      } else {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error || "Update failed",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Add New */}
      <div className="flex gap-2">
        <Input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="New category name"
          disabled={loading || loadingCategories}
        />
        <Button onClick={addCategory} disabled={loading || loadingCategories}>
          {loading ? "Adding..." : "Add"}
        </Button>
      </div>

      {/* List */}
      <div className="border rounded-md p-4 min-h-[100px]">
        {loadingCategories ? (
          // Skeleton loader: multiple gray bars with pulse animation
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-6 w-full bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p>No categories yet.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat._id} className="flex justify-between items-center">
                <span>{cat.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(cat);
                      setEditName(cat.name);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteCategory(cat._id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="New category name"
              disabled={loading}
            />
            <Button onClick={updateCategory} disabled={loading}>
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
