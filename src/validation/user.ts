import { z } from "zod";

export const USER_ROLES = ["admin", "employee"] as const;
export const USER_PAGES = [
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

const emailSchema = z.string().trim().email("Invalid email").max(254);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(128);

// Unknown keys are dropped, so nothing else (for example _id) can be written through these routes.
export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(USER_ROLES),
  pages: z.array(z.enum(USER_PAGES)).default([]),
});

// An empty password means "keep the current one".
export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120).optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional().or(z.literal("")),
  role: z.enum(USER_ROLES).optional(),
  pages: z.array(z.enum(USER_PAGES)).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
