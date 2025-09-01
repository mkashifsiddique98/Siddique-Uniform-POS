"use client";

import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Define allowed pages
const allowedPages = [
  "customer",
  "invoice",
  "pos",
  "product",
  "user",
  "utilize",
  "purchase",
  "dashboard",
  "user/profile",
] as const;

const userSchemaCreate = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "employee"]),
  pages: z.array(z.enum(allowedPages)),
});

const userSchemaUpdate = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6).optional().or(z.literal("")),
  role: z.enum(["admin", "employee"]),
  pages: z.array(z.enum(allowedPages)),
});

export type UserFormValues = z.infer<typeof userSchemaCreate>;

interface UserFormProps {
  mode: "create" | "update";
  data: Partial<UserFormValues> & { id?: string };
  fetchUsers: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserForm: FC<UserFormProps> = ({
  mode,
  data,
  fetchUsers,
  open,
  onOpenChange,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const schema = mode === "update" ? userSchemaUpdate : userSchemaCreate;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "employee",
      pages: [],
    },
  });

  useEffect(() => {
    reset({
      name: data.name ?? "",
      email: data.email ?? "",
      password: "",
      role: data.role ?? "employee",
      pages: data.pages ?? [],
    });
  }, [data, reset]);

  const onSubmit = async (formData: UserFormValues) => {
     if (mode === "update" && formData.password === "") {
    delete formData.password;
  }
    const url =
      mode === "update" && data.id ? `/api/users/${data.id}` : "/api/users";
    const method = mode === "update" ? "PUT" : "POST";
   
    setLoading(true);

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
       console.log("Respone:",res)
      if (!res.ok) throw new Error("Failed to submit user");

      toast({
        title:
          mode === "update"
            ? "User updated successfully!"
            : "User created successfully!",
      });

      fetchUsers();
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title:
          mode === "update" ? "Error updating user" : "Error creating user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
     
      <DialogContent className="max-w-md" aria-describedby={undefined}>
         <DialogTitle>{mode === "update" ? "Update User" : "Create User"}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGroup label="Name" error={errors.name?.message}>
            <Input id="name" {...register("name")} />
          </FormGroup>

          <FormGroup label="Email" error={errors.email?.message}>
            <Input id="email" type="email" {...register("email")} />
          </FormGroup>

          <FormGroup label="Password" error={errors.password?.message}>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={
                  mode === "update" ? "Leave blank to keep existing" : ""
                }
                {...register("password")}
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </FormGroup>

          <FormGroup label="Role" error={errors.role?.message}>
            <select {...register("role")} className="w-full border p-2 rounded">
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </FormGroup>

          <FormGroup label="Pages" error={errors.pages?.message}>
            <div className="grid grid-cols-2 gap-2">
              {allowedPages.map((page) => (
                <label key={page} className="flex items-center gap-2">
                  <input type="checkbox" value={page} {...register("pages")} />
                  {page}
                </label>
              ))}
            </div>
          </FormGroup>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? mode === "update"
                ? "Updating..."
                : "Adding..."
              : mode === "update"
              ? "Update User"
              : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;

interface FormGroupProps {
  label: string;
  children: React.ReactNode;
  error?: string;
}

function FormGroup({ label, children, error }: FormGroupProps) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
