import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SaleDocument extends Document {
  invoiceNumber: number;
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  customerId?: mongoose.Types.ObjectId;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: "cash" | "card" | "bankily";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const saleItemSchema = new Schema<SaleItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const saleSchema = new Schema<SaleDocument>(
  {
    invoiceNumber: { type: Number, required: true, unique: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    employeeName: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    items: { type: [saleItemSchema], required: true, validate: (v: SaleItem[]) => v.length > 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cash", "card", "bankily"], required: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

saleSchema.index({ employeeId: 1, createdAt: -1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ invoiceNumber: 1 });

export const Sale: Model<SaleDocument> =
  mongoose.models.Sale || mongoose.model<SaleDocument>("Sale", saleSchema);
