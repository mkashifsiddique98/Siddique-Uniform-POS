"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

// Define user schema
const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "employee"]),
  pages: z.array(z.enum(["customer", "invoice", "pos", "product", "user", "utilize"])),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function AddUserForm({ fetchUsers }: { fetchUsers: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, setValue, getValues, reset } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "employee", pages: [] },
  });

  const onSubmit = async (data: UserFormValues) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to create user");
      }

      toast({ title: "User added successfully!" });
      fetchUsers(); // Refresh user list
      reset();
      setIsOpen(false);
    } catch (error) {
      toast({ title: "Error adding user", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>Add New User</DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...register("name")} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" {...register("password")} />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              value={getValues("role")}
              onValueChange={(value) => setValue("role", value as "admin" | "employee")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Allowed Pages</Label>
            <div className="grid grid-cols-2 gap-2">
              {["customer", "invoice", "pos", "product", "user", "utilize"].map((page) => (
                <div key={page} className="flex items-center space-x-2">
                  <Checkbox
                    checked={getValues("pages").includes(page)}
                    onCheckedChange={(checked) => {
                      const newPages = checked
                        ? [...getValues("pages"), page]
                        : getValues("pages").filter((p) => p !== page);
                      setValue("pages", newPages);
                    }}
                  />
                  <Label>{page}</Label>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit">Create User</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
