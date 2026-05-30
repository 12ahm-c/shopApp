import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    password: z.string().min(6).optional()
  })
  .refine((value) => value.name !== undefined || value.password !== undefined, {
    message: "At least one field is required"
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
