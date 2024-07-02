import { z } from "zod";
// create prodcut
export const formSchema = z.object({
  productName: z.string().min(4, {
    message: "Product must be at least 4 characters.",
  }),
  schoolName: z.string(),
  // supplier: z.string(),
  category: z.string(),
  size: z.string(),
  // quantity: z.coerce.number(),
  sellPrice: z.coerce.number(),
  wholesalePrice: z.coerce.number(),
  stockAlert : z.coerce.number(),
  productCost : z.coerce.number(),
});
