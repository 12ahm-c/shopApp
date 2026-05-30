import { z } from "zod";
import { isValidPhone, normalizePhone } from "../../utils/phone.util";

export const loginSchema = z.object({
  phone: z.string().transform(normalizePhone).refine(isValidPhone, "Invalid phone number"),
  password: z.string().min(6)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export const passwordChangeSchema = z.object({
  password: z.string().min(6)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
