import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface ExpenseDocument extends Document {
  description: string;
  category: string;
  amount: number;
  paidBy: mongoose.Types.ObjectId;
  paidByName: string;
  note?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<ExpenseDocument>(
  {
    description: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidByName: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 500 },
    date: { type: Date, required: true }
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });

export const Expense: Model<ExpenseDocument> =
  mongoose.models.Expense || mongoose.model<ExpenseDocument>("Expense", expenseSchema);
