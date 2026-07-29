import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createPurchaseItemSchema = z.object({
  productId: z.string().regex(objectIdRegex, "Invalid product ID").optional(),
  name: z.string().min(1, "Product name is required").max(200),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Price must be non-negative")
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().regex(objectIdRegex, "Invalid supplier ID").optional(),
  items: z.array(createPurchaseItemSchema).min(1, "At least one item is required"),
  notes: z.string().max(500).optional()
});

export const purchaseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  from: z.string().optional(),
  to: z.string().optional(),
  supplierId: z.string().regex(objectIdRegex).optional(),
  search: z.string().optional()
});

export const purchaseParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid purchase ID")
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type PurchaseListQuery = z.infer<typeof purchaseListQuerySchema>;
