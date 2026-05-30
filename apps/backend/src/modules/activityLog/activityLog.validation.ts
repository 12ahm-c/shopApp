import { z } from "zod";

export const activityLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  action: z.enum(["sale", "delete_invoice", "login", "logout"]).optional(),
  userId: z.string().optional()
});

export type ActivityLogListQuery = z.infer<typeof activityLogListQuerySchema>;
