import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface IExpense {
  title: string;
  amount: number;
  category: string;
  date: Date;
  note?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ExpenseDocument extends IExpense, Document {}

const expenseSchema = new Schema<ExpenseDocument>(
  {
    title: { type: String, required: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 1 },
    category: { type: String, required: true, enum: ["salary", "rent", "utility", "other"] },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const Expense: Model<ExpenseDocument> = mongoose.models.Expense || mongoose.model<ExpenseDocument>("Expense", expenseSchema);
