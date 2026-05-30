import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface DebtTransaction {
  date: Date;
  amount: number;
  type: "increase" | "decrease";
  note?: string;
  newTotalDebt: number;
}

export interface SupplierDocument extends Document {
  name: string;
  phone?: string;
  address?: string;
  totalDebt: number;
  transactions: DebtTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<DebtTransaction>(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["increase", "decrease"], required: true },
    note: { type: String, maxlength: 200 },
    newTotalDebt: { type: Number, required: true }
  },
  { _id: false }
);

const supplierSchema = new Schema<SupplierDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: { type: String, trim: true, sparse: true, unique: true },
    address: { type: String, trim: true },
    totalDebt: { type: Number, default: 0 },
    transactions: { type: [transactionSchema], default: [] }
  },
  { timestamps: true }
);

export const Supplier: Model<SupplierDocument> =
  mongoose.models.Supplier || mongoose.model<SupplierDocument>("Supplier", supplierSchema);
