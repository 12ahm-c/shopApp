import mongoose, { Schema, type Model, type Document } from "mongoose";

export type NotificationType = "low_stock" | "daily_summary" | "debt_updated" | "invoice_deleted";

export interface NotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  readAt: Date | null;
  data: Record<string, unknown>;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["low_stock", "daily_summary", "debt_updated", "invoice_deleted"],
    required: true
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  data: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export const Notification: Model<NotificationDocument> =
  mongoose.models.Notification || mongoose.model<NotificationDocument>("Notification", notificationSchema);
