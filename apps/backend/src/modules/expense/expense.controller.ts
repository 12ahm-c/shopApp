import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { ExpenseService } from "./expense.service";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseListQuery
} from "./expense.validation";

const expenseService = new ExpenseService();

export const expenseController = {
  getExpenses: asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.getExpenses(req.validated?.query as ExpenseListQuery);
    successResponse(res, result.expenses, 200, result.meta);
  }),

  createExpense: asyncHandler(async (req: Request, res: Response) => {
    const data = await expenseService.createExpense(
      req.validated?.body as CreateExpenseInput,
      (req as any).user.userId
    );
    successResponse(res, data, 201);
  }),

  updateExpense: asyncHandler(async (req: Request, res: Response) => {
    const data = await expenseService.updateExpense(
      String(req.params.id),
      req.validated?.body as UpdateExpenseInput
    );
    successResponse(res, data);
  }),

  deleteExpense: asyncHandler(async (req: Request, res: Response) => {
    await expenseService.deleteExpense(String(req.params.id));
    successResponse(res, null, 204);
  })
};
