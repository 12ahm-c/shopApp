import { z } from "zod";

export const updateSettingsSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  storeAddress: z.string().max(200).optional(),
  storePhone: z.string().max(20).optional(),
  logoUrl: z.string().max(500).optional(),
  currency: z.string().min(1).max(10).optional(),
  invoiceFooter: z.string().max(200).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  language: z.enum(["ar", "fr"]).optional()
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
