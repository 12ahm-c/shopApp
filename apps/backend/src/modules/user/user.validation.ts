import { z } from "zod";
import { isValidPhone, normalizePhone } from "../../utils/phone.util";

const phoneSchema = z.string().transform(normalizePhone).refine(isValidPhone, "Invalid phone number");

export const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(6).optional()
  })
  .refine((value) => value.name !== undefined || value.phone !== undefined || value.password !== undefined, {
    message: "At least one field is required"
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
