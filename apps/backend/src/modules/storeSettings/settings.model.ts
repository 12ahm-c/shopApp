import mongoose, { Schema, type Model, type Document } from "mongoose";

export interface StoreSettingsDocument extends Document {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  logoUrl: string;
  currency: string;
  invoiceFooter: string;
  theme: "light" | "dark";
  language: "ar" | "fr";
}

const settingsSchema = new Schema<StoreSettingsDocument>({
  storeName: { type: String, default: "ShopManager Store" },
  storeAddress: { type: String, default: "" },
  storePhone: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  currency: { type: String, default: "MRU" },
  invoiceFooter: { type: String, default: "Merci de votre visite !" },
  theme: { type: String, enum: ["light", "dark"], default: "light" },
  language: { type: String, enum: ["ar", "fr"], default: "fr" }
}, { timestamps: true });

export const StoreSettings: Model<StoreSettingsDocument> =
  mongoose.models.StoreSettings || mongoose.model<StoreSettingsDocument>("StoreSettings", settingsSchema);
