"use client";
import { useEffect, useState } from "react";
import AddUserForm from "./UserForm";
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      if (!res.ok) throw new Error("Failed to delete user");

      toast({ title: "User deleted successfully!" });
      fetchUsers();
    } catch (error) {
      toast({ title: "Error deleting user", variant: "destructive" });
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="User" subfolder="User Management" />
      <Card className="p-2">
        <CardContent>
          <div className="flex justify-end mb-6 mt-2 gap-2">
            {/* Add User */}
            <AddUserForm fetchUsers={fetchUsers} mode="create" />
            {/* Edit User Dialog (conditionally rendered) */}
            {selectedUser && (
              <AddUserForm
                key={`${selectedUser._id}`} // ensure re-render when new user selected
                user={{
                  ...selectedUser,
                  id: selectedUser._id,
                }}
                mode="update"
                fetchUsers={() => {
                  fetchUsers();
                  setSelectedUser(null);
                  setIsDialogOpen(false);
                }}
                open={isDialogOpen}
              />
            )}
          </div>

          {users.length > 0 ? (
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
                  <TableRow key={`${user._id}`}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="normal-case">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.pages?.join(", ")}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="outline" onClick={() => handleEdit(user)}>
                        Edit
                      </Button>
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
            </Table>
          ) : (
            <p className="text-center capitalize">No record found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
