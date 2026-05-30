import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../types";
import { AppError } from "../utils/AppError";

export const ROLE_PERMISSIONS = {
  admin: ["*"],
  employee: ["sale:create", "product:read", "invoice:read:own", "activity_log:read:own"]
} as const;

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "AUTH_REQUIRED", "Authentication required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "FORBIDDEN", "Role lacks the required permission"));
      return;
    }

    next();
  };
