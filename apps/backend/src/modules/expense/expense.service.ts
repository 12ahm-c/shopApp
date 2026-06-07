import { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { Expense, type ExpenseDocument } from "./expense.model";
import type { CreateExpenseInput, UpdateExpenseInput, ExpenseListQuery } from "./expense.validation";

export class ExpenseService {
  async getExpenses(query: ExpenseListQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: Record<string, unknown> = {};

    if (query.from || query.to) {
      filter.date = {};
      if (query.from) (filter.date as Record<string, unknown>).$gte = new Date(query.from);
      if (query.to) (filter.date as Record<string, unknown>).$lte = new Date(query.to);
    }
    if (query.category) {
      filter.category = query.category;
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter)
    ]);

    return { expenses, meta: { page, limit, total } };
  }

  async createExpense(data: CreateExpenseInput, userId: string): Promise<ExpenseDocument> {
    const expense = await Expense.create({
      ...data,
      date: data.date ? new Date(data.date) : new Date(),
      createdBy: new Types.ObjectId(userId)
    });
    return expense;
  }

  async updateExpense(id: string, data: UpdateExpenseInput): Promise<ExpenseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(404, "NOT_FOUND", "Expense not found");
    }

    const updated = await Expense.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new AppError(404, "NOT_FOUND", "Expense not found");
    }

    return updated;
  }

  async deleteExpense(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(404, "NOT_FOUND", "Expense not found");
    }

    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError(404, "NOT_FOUND", "Expense not found");
    }
  }
}
