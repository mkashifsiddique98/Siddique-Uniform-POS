"use client";

import React, { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import UserForm from "./UserForm";
import { User } from "@/types/user";

interface UserTableProps {
  userData: User[];
}

const UserTable: React.FC<UserTableProps> = ({ userData }) => {
  const [users, setUsers] = useState<User[]>(userData);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "update">("create");

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      toast({ title: "Failed to fetch users", variant: "destructive" });
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");

      toast({ title: "User deleted successfully" });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (error) {
      toast({ title: "Error deleting user", variant: "destructive" });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser({ ...user, id: user._id });
    setMode("update");
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setMode("create");
    setIsDialogOpen(true);
  };

  const handleFormClose = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>Add User</Button>
      </div>

      <UserForm
        open={isDialogOpen}
        onOpenChange={(open) => !open && handleFormClose()}
        data={selectedUser || {}}
        mode={mode}
        fetchUsers={fetchUsers}
      />

      {users.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={`${user._id}`}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.pages?.join(", ")}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => openEditDialog(user)}>
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(user._id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-muted-foreground">No users found.</p>
      )}
    </div>
  );
};

export default UserTable;
