import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface ProductDocument extends Document {
  name: string;
  category: string;
  price: number;
  quantity: number;
  alertThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100, unique: true },
    category: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    alertThreshold: { type: Number, default: 5, min: 0 }
  },
  { timestamps: true }
);

productSchema.index({ name: "text" });
productSchema.index({ category: 1 });

export const Product: Model<ProductDocument> =
  mongoose.models.Product || mongoose.model<ProductDocument>("Product", productSchema);
