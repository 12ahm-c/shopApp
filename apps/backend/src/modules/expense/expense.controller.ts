import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { expenseService } from "./expense.service";
import type { CreateExpenseInput, UpdateExpenseInput, ExpenseListQuery } from "./expense.validation";

export const expenseController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await expenseService.createExpense(
      req.body as CreateExpenseInput,
      req.user!.userId
    );
    successResponse(res, data, 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.getExpenses(req.validated?.query as ExpenseListQuery);
    successResponse(res, result.data, 200, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await expenseService.getExpenseById(String(req.params.id));
    successResponse(res, data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await expenseService.updateExpense(String(req.params.id), req.body as UpdateExpenseInput);
    successResponse(res, data);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await expenseService.deleteExpense(String(req.params.id));
    successResponse(res, null, 204);
  })
};
