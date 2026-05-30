import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../modules/user/user.model";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt.util";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "AUTH_REQUIRED", "No token provided"));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("role").lean();
    if (!user) {
      next(new AppError(401, "TOKEN_INVALID", "Token user does not exist"));
      return;
    }

    req.user = { userId: payload.sub, role: user.role };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, "TOKEN_EXPIRED", "Access token expired"));
      return;
    }
    next(new AppError(401, "TOKEN_INVALID", "Token signature invalid"));
  }
};
