import type { Types } from "mongoose";

export type UserRole = "admin" | "employee";
export type AttendanceStatus = "present" | "absent";

export interface AuthUser {
  userId: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  jti?: string;
}

export interface AttendanceEntry {
  date: Date;
  status: AttendanceStatus;
}

export interface RefreshTokenEntry {
  tokenHash: string;
  jti: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export interface UserDocument {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  salary: number;
  attendance: AttendanceEntry[];
  refreshTokens: RefreshTokenEntry[];
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
  validatePassword(password: string): Promise<boolean>;
}

export type PaymentMethod = "cash" | "card" | "bankily";

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}
