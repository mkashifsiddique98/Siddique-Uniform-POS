"use client";

import React, { useState, useEffect, FormEvent } from "react";
import BreadCrum from "@/components/custom-components/bread-crum";
import { Button } from "@/components/ui/button";

interface Item {
  _id: string;
  name: string;
  sizes: string[];
}

const CategoryAndSize: React.FC = () => {
  const [data, setData] = useState<Item[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemName, setItemName] = useState<string>("");
  const [itemSize, setItemSize] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/product/category-and-size");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const jsonData: Item[] = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data");
      }
    };
    fetchData();
  }, []);

  const toggleModal = () => {
    setShowModal((prev) => !prev);
    setError("");
  };

  const openAddModal = () => {
    setEditingItem(null);
    setItemName("");
    setItemSize("");
    toggleModal();
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemSize(item.sizes.join(", "));
    toggleModal();
  };

  const handleDelete = async (_id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const response = await fetch(`/api/product/category-and-size`, {
        method: "DELETE",
        body: JSON.stringify(_id)
      });
      if (!response.ok) {
        throw new Error("Failed to delete item");
      }
      setData((prev) => prev.filter((item) => item._id !== _id));
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Error deleting item");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemSize.trim()) {
      setError("Please fill in all fields");
      return;
    }

    const newItem = {
      name: itemName.trim(),
      sizes: itemSize
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch(
        "/api/product/category-and-size",
        {
          method: editingItem ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingItem ? editingItem : newItem),
        }
      );
      if (!response.ok) {
        console.log("Failed to save item");
      }
      const updatedResponse = await response.json();
      const updatedItem = updatedResponse.response
      if (editingItem) {
        setData((prev) =>
          prev.map((item) => (item._id === editingItem._id ? updatedItem : item))
        );

      } else {
        setData((prev) => [...prev, updatedItem]);
      }
      toggleModal();
    } catch (error) {
      console.error("Error saving data:", error);
      setError("Error saving data");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <BreadCrum mainfolder="Product" subfolder="Categories and their Sizes" />
      <Button
        className="bg-blue-500 hover:bg-blue-700 text-white w-full"
        onClick={openAddModal}
      >
        Add Category and Sizes
      </Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <div className="grid grid-cols-3 gap-4 m-2 p-4">
        {data.map((item) => (
          <div key={item._id} className="m-2 shadow-2xl p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold capitalize">{item.name}</h2>
            </div>
            {item?.sizes?.length > 0 && (
              <ul className="mt-2">
                {item.sizes.map((size, index) => (
                  <li key={index} className="text-sm">
                    {size}
                  </li>
                ))}
              </ul>

            )}
            <div className="flex gap-4 justify-end">
              <Button onClick={() => openEditModal(item)} className="px-4">
                Edit
              </Button>
              <Button
                onClick={() => handleDelete(item._id)}
                className="px-4 bg-red-500 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>


      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
          <div className="bg-white p-8 rounded-lg w-[600px]">
            <h2 className="text-lg font-semibold mb-4">
              {editingItem ? "Edit Item" : "Add Item"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="itemName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Category Name
                </label>
                <input
                  id="itemName"
                  type="text"
                  className="border border-gray-400 rounded px-2 py-1 mt-2 w-full"
                  placeholder="Category Name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="itemSize"
                  className="block text-sm font-medium text-gray-700"
                >
                  Sizes (comma-separated)
                </label>
                <input
                  id="itemSize"
                  type="text"
                  className="border border-gray-400 rounded px-2 py-1 mt-2 w-full"
                  placeholder="e.g. 18, 20, 22"
                  value={itemSize}
                  onChange={(e) => setItemSize(e.target.value)}
                />
                <p className="text-gray-400 mt-1 text-xs">
                  Use commas to separate sizes (e.g. 18, 20, 22...)
                </p>
              </div>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                >
                  {editingItem ? "Save" : "Add"}
                </button>
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  onClick={toggleModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryAndSize;
