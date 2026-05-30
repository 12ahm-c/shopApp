import { z } from "zod";
import { isValidPhone, normalizePhone } from "../../utils/phone.util";

const phoneSchema = z.string().transform(normalizePhone).refine(isValidPhone, "Invalid phone number");

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema.optional(),
  initialDebt: z.number().int().min(0).optional().default(0)
});

export const debtSchema = z.object({
  amount: z.number().int().min(1),
  type: z.enum(["increase", "decrease"]),
  note: z.string().max(200).optional()
});

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  hasDebt: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional()
    .default(false),
  search: z.string().trim().optional()
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type DebtInput = z.infer<typeof debtSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
