import { z } from "zod";
import { isValidPhone, normalizePhone } from "../../utils/phone.util";

const phoneSchema = z.string().transform(normalizePhone).refine(isValidPhone, "Invalid phone number");

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema.optional(),
  address: z.string().trim().optional(),
  initialDebt: z.number().int().min(0).optional().default(0)
});

export const updateSupplierSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    phone: phoneSchema.optional(),
    address: z.string().trim().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const debtSchema = z.object({
  amount: z.number().int().min(1),
  type: z.enum(["increase", "decrease"]),
  note: z.string().max(200).optional()
});

export const supplierListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  hasDebt: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional()
    .default(false),
  search: z.string().trim().optional()
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierDebtInput = z.infer<typeof debtSchema>;
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>;
