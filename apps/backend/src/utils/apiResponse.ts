import type { Response } from "express";

export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "DUPLICATE"
  | "INSUFFICIENT_STOCK"
  | "INVALID_STATE"
  | "INTERNAL";

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  fields?: Record<string, string>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  status = 200,
  meta: PaginationMeta | null = null
): void => {
  res.status(status).json({ success: true, data, error: null, meta });
};

export const errorResponse = (
  res: Response,
  status: number,
  error: ApiErrorBody
): void => {
  res.status(status).json({ success: false, data: null, error, meta: null });
};
