import { z } from "zod";

export const createSaleItemSchema = z.object({
  productId: z.string().regex(/^[a-f0-9]{24}$/, "Invalid productId"),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0)
});

export const createSaleSchema = z.object({
  items: z.array(createSaleItemSchema).min(1, "At least one item is required"),
  customerId: z.string().regex(/^[a-f0-9]{24}$/, "Invalid customerId").optional(),
  customerName: z.string().trim().min(1).max(100).optional(),
  paymentMethod: z.enum(["cash", "card", "bankily", "alsadd", "bimbank", "masrafi"])
});

export const saleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  employeeId: z.string().regex(/^[a-f0-9]{24}$/, "Invalid employeeId").optional(),
  customerId: z.string().regex(/^[a-f0-9]{24}$/, "Invalid customerId").optional()
});

export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/, "Invalid ObjectId")
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CreateSaleItemInput = z.infer<typeof createSaleItemSchema>;
export type SaleListQuery = z.infer<typeof saleListQuerySchema>;
