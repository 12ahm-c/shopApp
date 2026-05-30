import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { errorResponse } from "../utils/apiResponse";
import { log } from "../utils/logger";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(404, "NOT_FOUND", `${req.method} ${req.originalUrl} not found`));
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    errorResponse(res, error.statusCode, {
      code: error.code,
      message: error.message,
      ...(error.fields ? { fields: error.fields } : {})
    });
    return;
  }

  log("error", "Unhandled server error", { errorName: error.name, message: error.message });
  errorResponse(res, 500, { code: "INTERNAL", message: "Server error" });
};
