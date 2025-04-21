"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

// Define user schema
const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "employee"]),
  pages: z.array(
    z.enum(["customer", "invoice", "pos", "product", "user", "utilize"])
  ),
});

export type UserFormValues = z.infer<typeof userSchema>;
const allowedPages = [
  "customer",
  "invoice",
  "pos",
  "product",
  "user",
  "utilize",
  "purchase",
] as const;

interface UserFormProps {
  // When editing, pass in the user data (including an id property)
  user?: UserFormValues & { id: string };
  fetchUsers: () => void;
  // Optionally control whether the dialog is open externally
  open?: boolean;
}

export default function UserForm({
  user,
  fetchUsers,
  open: openProp,
}: UserFormProps) {
  const [isOpen, setIsOpen] = useState(openProp ?? false);

  // Initialize the form with default values from the user (if editing) or with defaults for adding.
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: user ? { ...user } : { role: "employee", pages: [] },
  });

  // When the user prop changes (e.g. editing a different user), reset the form.
  useEffect(() => {
    if (user) {
      reset(user);
    } else {
      reset({ role: "employee", pages: [] });
    }
  }, [user, reset]);

  const pages = watch("pages");

  const onSubmit = async (data: UserFormValues) => {
    try {
      // Choose API endpoint and method based on whether a user is provided.
      const endpoint = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(user ? "Failed to update user" : "Failed to create user");
      }

      toast({
        title: user ? "User updated successfully!" : "User added successfully!",
      });
      fetchUsers();
      reset();
      setIsOpen(false);
    } catch (error) {
      toast({
        title: user ? "Error updating user" : "Error adding user",
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    if (user) {
      reset(user);
    }
  }, [user, reset]);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>{user ? "Edit User" : "Add User"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>{user ? "Edit User" : "Add New User"}</DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={watch("role")}
              onValueChange={(value) =>
                setValue("role", value as "admin" | "employee")
              }
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
            )}
          </div>
          <div>
            <Label>Allowed Pages</Label>
            <div className="grid grid-cols-2 gap-2">
              {allowedPages.map((page) => (
                <div key={page} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={page}
                    checked={pages.includes(page)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const newPages = checked
                        ? [...pages, page]
                        : pages.filter((p) => p !== page);
                      setValue("pages", newPages, { shouldValidate: true });
                    }}
                    className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <Label htmlFor={page} className="capitalize">
                    {page}
                  </Label>
                </div>
              ))}
            </div>
            {errors.pages && (
              <p className="text-red-500 text-xs mt-1">{errors.pages.message}</p>
            )}
          </div>
          <Button type="submit">{user ? "Update User" : "Create User"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
