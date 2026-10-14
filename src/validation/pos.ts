import { z } from 'zod';

export const customerPayloadSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required'),
  schoolName: z.string().trim().optional().or(z.literal('')),
  type: z.string().trim().optional().or(z.literal('')),
  phone: z.union([z.string(), z.number()]).optional(),
  prevBalance: z.number().min(0).optional(),
  _id: z.string().optional(),
});

export const productPayloadSchema = z.object({
  productName: z.string().trim().min(1, 'Product name is required'),
  schoolName: z.string().trim().optional().or(z.literal('')),
  supplier: z.string().trim().optional().or(z.literal('')),
  category: z.string().trim().min(1, 'Category is required'),
  size: z.string().trim().min(1, 'Size is required'),
  sellPrice: z.number().min(0),
  wholesalePrice: z.number().min(0),
  productCost: z.number().min(0),
  quantity: z.number().min(0).optional(),
  stockAlert: z.number().min(0).optional(),
  isBundle: z.boolean().optional(),
  components: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  productId: z.string().optional(),
  _id: z.string().optional(),
});

export const invoicePayloadSchema = z.object({
  // Ignored for new invoices (the server numbers them); only used when isEdit is true
  invoiceNo: z.number().int().min(1).optional(),
  isEdit: z.boolean().optional(),
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
  discount: z.number().min(0).optional().default(0),
  prevBalance: z.number().min(0).optional().default(0),
  grandTotal: z.number().min(0).optional().default(0),
  anyMessage: z.string().optional().or(z.literal('')),
  dueDate: z.union([z.string(), z.date(), z.number()]).nullable().optional(),
  customer: customerPayloadSchema.optional(),
  productDetail: z.array(
    z.object({
      productId: z.union([z.string(), z.object({})]).optional(),
      productName: z.string().trim().min(1),
      quantity: z.number().min(0),
      sellPrice: z.number().min(0),
      return: z.boolean().optional(),
      sold: z.boolean().optional(),
      mode: z.enum(['sale', 'return']).optional(),
      returnReason: z.string().optional(),
    })
  ).min(1),
});
