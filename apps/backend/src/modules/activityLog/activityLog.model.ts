import mongoose, { Schema, type Model, type Document } from "mongoose";

export type ActivityAction = "sale" | "delete_invoice" | "login" | "logout";

export interface ActivityLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  action: ActivityAction;
  details: string;
  amount: number | null;
  timestamp: Date;
}

const activityLogSchema = new Schema<ActivityLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    action: { type: String, enum: ["sale", "delete_invoice", "login", "logout"], required: true },
    details: { type: String, required: true },
    amount: { type: Number, default: null },
    timestamp: { type: Date, default: Date.now }
  },
  { collection: "activity_logs" }
);

activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

export const ActivityLog: Model<ActivityLogDocument> =
  mongoose.models.ActivityLog || mongoose.model<ActivityLogDocument>("ActivityLog", activityLogSchema);
