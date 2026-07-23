// create prodcut
import { z } from "zod";

export const formSchema = z
  .object({
    productName: z.string().min(4, {
      message: "Product must be at least 4 characters.",
    }),
    schoolName: z.string(),
    category: z.string(),
    size: z.string(),
    isBundle: z.boolean().optional(),
    sellPrice: z.coerce.number(),
    wholesalePrice: z.coerce.number(),
    stockAlert: z.coerce.number(),
    productCost: z.coerce.number(),
    components: z.array(z.string()).optional(),
    images:  z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isBundle && (!data.components || data.components.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["components"],
        message: "Components must be selected when 'Is Bundle' is true.",
      });
    }
  });
