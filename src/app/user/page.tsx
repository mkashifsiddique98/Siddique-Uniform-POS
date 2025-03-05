"use client";
import { useEffect, useState } from "react";
import AddUserForm from "./AddUserForm";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@/types/user";
import BreadCrum from "@/components/custom-components/bread-crum";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete user");
      }
      toast({ title: "User deleted successfully!" });
      fetchUsers(); // Refresh the user list after deletion
    } catch (error) {
      toast({ title: "Error deleting user", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="User" subfolder="User Management" />
      <Card className="p-2">
        <CardContent>
          <div className="flex justify-end mb-6 mt-2">
            <AddUserForm fetchUsers={fetchUsers} />
          </div>
          {users.length > 0 ? 
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Allowed Pages</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email + user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.pages.join(", ")}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      onClick={() => deleteUser(user._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table> : <p className="align-centre capitalize">no Record Found </p> }
        </CardContent>
      </Card>
    </div>
  );
}
