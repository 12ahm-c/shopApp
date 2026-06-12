import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "salaries",
  "supplies",
  "maintenance",
  "transport",
  "marketing",
  "taxes",
  "other"
] as const;

export const createExpenseSchema = z.object({
  description: z.string().min(2).max(200),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().int().min(1),
  note: z.string().max(500).optional(),
  date: z.string().datetime().optional().default(() => new Date().toISOString())
});

export const updateExpenseSchema = z.object({
  description: z.string().min(2).max(200).optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  amount: z.number().int().min(1).optional(),
  note: z.string().max(500).optional(),
  date: z.string().datetime().optional()
});

export const expenseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().trim().optional()
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseListQuery = z.infer<typeof expenseListQuerySchema>;
