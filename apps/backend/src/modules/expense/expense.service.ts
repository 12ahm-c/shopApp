import { Types } from "mongoose";
import { Expense, type ExpenseDocument } from "./expense.model";
import { AppError } from "../../utils/AppError";
import { serializeExpense } from "../../utils/serializer";
import { User } from "../user/user.model";
import type { CreateExpenseInput, UpdateExpenseInput, ExpenseListQuery } from "./expense.validation";

const ensureObjectId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, "NOT_FOUND", "Expense does not exist");
};

export const expenseService = {
  async createExpense(input: CreateExpenseInput, userId: string) {
    const user = await User.findById(userId).select("name").lean();
    if (!user) throw new AppError(404, "NOT_FOUND", "User does not exist");

    const expense = await Expense.create({
      ...input,
      date: new Date(input.date),
      paidBy: new Types.ObjectId(userId),
      paidByName: user.name
    });

    return serializeExpense(expense);
  },

  async getExpenses(query: ExpenseListQuery) {
    const filter: Record<string, unknown> = {};

    if (query.category) {
      filter.category = query.category;
    }

    if (query.search) {
      filter.description = { $regex: query.search, $options: "i" };
    }

    if (query.from || query.to) {
      const dateFilter: Record<string, Date> = {};
      if (query.from) dateFilter.$gte = new Date(query.from);
      if (query.to) dateFilter.$lte = new Date(query.to);
      filter.date = dateFilter;
    }

    const skip = (query.page - 1) * query.limit;
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(query.limit),
      Expense.countDocuments(filter)
    ]);

    return {
      data: expenses.map((e) => serializeExpense(e)),
      meta: { page: query.page, limit: query.limit, total }
    };
  },

  async getExpenseById(id: string) {
    ensureObjectId(id);
    const expense = await Expense.findById(id);
    if (!expense) throw new AppError(404, "NOT_FOUND", "Expense does not exist");
    return serializeExpense(expense);
  },

  async updateExpense(id: string, input: UpdateExpenseInput) {
    ensureObjectId(id);
    const update: Record<string, unknown> = { ...input };
    if (input.date) update.date = new Date(input.date);

    const expense = await Expense.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true
    });

    if (!expense) throw new AppError(404, "NOT_FOUND", "Expense does not exist");
    return serializeExpense(expense);
  },

  async deleteExpense(id: string) {
    ensureObjectId(id);
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) throw new AppError(404, "NOT_FOUND", "Expense does not exist");
  }
};
