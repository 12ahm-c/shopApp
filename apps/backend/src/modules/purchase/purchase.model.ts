import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface PurchaseItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseDocument extends Document {
  purchaseNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseItemSchema = new Schema<PurchaseItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const purchaseSchema = new Schema<PurchaseDocument>({
  purchaseNumber: { type: String, required: true, unique: true },
  supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  supplierName: { type: String, required: true },
  items: { type: [purchaseItemSchema], required: true, min: 1 },
  totalAmount: { type: Number, required: true, min: 0 },
  notes: { type: String, default: "" }
}, { timestamps: true });

purchaseSchema.index({ supplierId: 1, createdAt: -1 });
purchaseSchema.index({ createdAt: -1 });
purchaseSchema.index({ purchaseNumber: 1 });

export const Purchase: Model<PurchaseDocument> =
  mongoose.models.Purchase || mongoose.model<PurchaseDocument>("Purchase", purchaseSchema);
