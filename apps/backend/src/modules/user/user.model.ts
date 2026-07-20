import mongoose, { Schema, type Model } from "mongoose";
import { comparePassword } from "../../utils/password.util";
import type { UserDocument } from "../../types";

const attendanceSchema = new Schema(
  {
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent"], required: true }
  },
  { _id: false }
);

const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    jti: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    createdAt: { type: Date, default: Date.now, required: true }
  },
  { _id: false }
);

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "employee"], required: true },
    salary: { type: Number, default: 0, min: 0 },
    attendance: { type: [attendanceSchema], default: [] },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
    fcmTokens: { type: [String], default: [] },
    lastActiveAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });

userSchema.methods.validatePassword = function validatePassword(password: string) {
  return comparePassword(password, this.passwordHash);
};

export const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);
