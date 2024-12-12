"use client";

import BreadCrum from "@/components/custom-components/bread-crum";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import React, { FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";

// Define the Customer interface based on the provided schema
interface Customer {
  _id: string;
  customerName: string;
  schoolName?: string;
  type?: string;
  phone: number;
  prevBalance: number;
  createdAt: string;
}

// CustomerTable Component
interface CustomerTableProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  searchQuery: string;
}

const CustomerTable: FC<CustomerTableProps> = ({
  customers,
  setCustomers,
  searchQuery,
}) => {
  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) =>
    customer.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort customers by createdAt in descending order
  const sortedCustomers = [...filteredCustomers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleDeleteCustomer = async (id: string) => {
    try {
      const res = await fetch(`/api/customer`, {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        toast({
          title: "Failed to delete the customer.",
          variant: "destructive",
        });
        return;
      }
      // Filter out the deleted customer and update the state
      const updatedCustomers = sortedCustomers.filter((item) => item._id !== id);
      setCustomers(updatedCustomers);
      toast({
        title: "Customer deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error deleting customer!",
        description: error?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">#</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>School Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Previous Balance</TableHead>
          <TableHead className="text-center">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedCustomers.map((customer, index) => (
          <TableRow key={index}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{customer.customerName}</TableCell>
            <TableCell>{customer.schoolName || "N/A"}</TableCell>
            <TableCell>{customer.type || "N/A"}</TableCell>
            <TableCell>{customer.phone}</TableCell>
            <TableCell>Rs {customer.prevBalance.toFixed(2)}</TableCell>
            <TableCell className="text-center">
              <Button className="ml-2" onClick={() => handleDeleteCustomer(customer._id)}>
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Main Customer List Page
const CustomerList: FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customer");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setCustomers(data?.listCustomer || []);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <div className="container p-6">
        <BreadCrum mainfolder="Customer" subfolder="List Customers" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>School Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Previous Balance</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="container p-2">
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by customer name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded w-full"
        />
      </div>

      {customers.length > 0 ? (
        <CustomerTable customers={customers} setCustomers={setCustomers} searchQuery={searchQuery} />
      ) : (
        <p>No customers found.</p>
      )}
    </div>
  );
};

export default CustomerList;
