import { z } from "zod";

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  unreadOnly: z
    .union([z.boolean(), z.string().transform((v) => v === "true")])
    .optional()
    .default(false),
  type: z.enum(["low_stock", "daily_summary", "debt_updated", "invoice_deleted"]).optional()
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
