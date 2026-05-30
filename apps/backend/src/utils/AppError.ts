import type { ApiErrorCode } from "./apiResponse";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly fields?: Record<string, string>;

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    fields?: Record<string, string>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}
