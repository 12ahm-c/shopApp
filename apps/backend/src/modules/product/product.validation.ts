import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  price: z.number().int().min(1),
  costPrice: z.number().int().min(0).default(0),
  quantity: z.number().int().min(0),
  alertThreshold: z.number().int().min(0).optional().default(5)
});

export const updateProductSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    category: z.string().min(2).max(50).optional(),
    price: z.number().int().min(1).optional(),
    costPrice: z.number().int().min(0).optional(),
    quantity: z.number().int().min(0).optional(),
    alertThreshold: z.number().int().min(0).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.string().trim().optional(),
  lowStock: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional()
    .default(false),
  search: z.string().trim().optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
