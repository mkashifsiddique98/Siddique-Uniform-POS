"use client";

import React, { useState, useEffect } from "react";
import BreadCrum from "@/components/custom-components/bread-crum";
import { Button } from "@/components/ui/button";

interface Item {
  id: string;
  name: string;
  size: string[];
}

const CategoryAndSize: React.FC = () => {
  const [data, setData] = useState<Item[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemName, setItemName] = useState<string>("");
  const [itemSize, setItemSize] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/size-catgory-template.json");
        const jsonData: Item[] = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const toggleModal = () => setShowModal(!showModal);

  const addItem = () => {
    setEditingItem(null);
    setItemName("");
    setItemSize("");
    toggleModal();
  };

  const saveData = async (updatedData: Item[]) => {
    try {
      const response = await fetch("/api/product/category-and-size", {
        method: "POST",
        body: JSON.stringify({ data: updatedData }),
      });
      const responseData = await response.json();
      if (responseData.success) {
        console.log("Data saved successfully");
      } else {
        console.error("Error saving data:", responseData.error);
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const saveItem = () => {
    if (editingItem) {
      const updatedData = data.map((item) => {
        if (item.id === editingItem.id) {
          return { ...item, name: itemName, size: itemSize.split(",") };
        }
        return item;
      });
      setData(updatedData);
      saveData(updatedData);
    } else {
      const newItem: Item = {
        id: String(data.length + 1),
        name: itemName,
        size: itemSize.split(","),
      };
      setData([...data, newItem]);
      saveData([...data, newItem]);
    }
    toggleModal();
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemSize(item.size.join(","));
    toggleModal();
  };

  const handleDelete = (id: string) => {
    const updatedData = data.filter((item) => item.id !== id);
    setData(updatedData);
    saveData(updatedData);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setItemName(e.target.value);

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setItemSize(e.target.value);

  return (
    <div className="container mx-auto p-4">
      <BreadCrum mainfolder="Product" subfolder="Categories and their Sizes" />
      <div className="container mx-auto">
        <Button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold w-full"
          onClick={addItem}
        >
          Add Category and Sizes
        </Button>
        <div className="m-2 shadow-xl p-4">
          {data.map((item) => (
            <div key={item.id} className="mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold mb-2">{item.name}</h2>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(item)} className="px-4">
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(item.id)}
                    className="px-4 bg-red-500 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <ul>
                {item.size.map((size, index) => (
                  <li key={index}>{size}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
            <div className="bg-white p-8 rounded-lg w-[600px]">
              <h2 className="text-lg font-semibold mb-4">
                {editingItem ? "Edit Item" : "Add Item"}
              </h2>
              <input
                type="text"
                className="border border-gray-400 rounded px-2 py-1 mt-2 w-full"
                placeholder="Category Name"
                value={itemName}
                onChange={handleNameChange}
              />
              <input
                type="text"
                className="border border-gray-400 rounded px-2 py-1 mt-2 w-full"
                placeholder="Sizes (comma-separated)"
                value={itemSize}
                onChange={handleSizeChange}
              />
              <p className="text-gray-400 mt-1">
                Use Comma to Add New Size in List (e.g 18, 20, 22...)
              </p>
              <div className="flex justify-end mt-4">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                  onClick={saveItem}
                >
                  {editingItem ? "Save" : "Add"}
                </button>
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  onClick={toggleModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryAndSize;
