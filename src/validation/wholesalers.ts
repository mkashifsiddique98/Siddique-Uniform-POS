import { z } from "zod";

export const wholesalerListQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  hasOutstanding: z.enum(["true", "false"]).optional(),
  from: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid from date").optional(),
  to: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid to date").optional(),
  sort: z.enum(["name", "outstanding", "lastPurchase", "orders"]).optional().default("name"),
  direction: z.enum(["asc", "desc"]).optional().default("asc"),
  page: z.coerce.number().int().min(1).max(100000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const wholesalerPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0").max(1_000_000_000),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date").optional(),
  note: z.string().trim().max(300).optional().default(""),
});

export const wholesalerHistoryQuerySchema = z.object({
  from: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid from date").optional(),
  to: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid to date").optional(),
  type: z.enum(["all", "purchase", "payment"]).optional().default("all"),
  page: z.coerce.number().int().min(1).max(100000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});
