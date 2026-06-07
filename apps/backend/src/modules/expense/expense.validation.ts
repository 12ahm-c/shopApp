import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().min(1).max(100),
  amount: z.number().int().positive(),
  category: z.enum(["salary", "rent", "utility", "other"]),
  date: z.string().datetime().optional(),
  note: z.string().optional()
});

export const updateExpenseSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  amount: z.number().int().positive().optional(),
  category: z.enum(["salary", "rent", "utility", "other"]).optional(),
  date: z.string().datetime().optional(),
  note: z.string().optional()
});

export const expenseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  category: z.enum(["salary", "rent", "utility", "other"]).optional()
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseListQuery = z.infer<typeof expenseListQuerySchema>;
