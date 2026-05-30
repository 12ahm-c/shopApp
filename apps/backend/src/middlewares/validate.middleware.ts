import type { NextFunction, Request, Response } from "express";
import { type ZodSchema, z } from "zod";
import { AppError } from "../utils/AppError";

type ValidationTarget = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, target: ValidationTarget = "body") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const fields: Record<string, string> = {};
      const flattened = z.flattenError(result.error);
      Object.entries(flattened.fieldErrors).forEach(([field, errors]) => {
        const messages = errors as string[] | undefined;
        if (messages?.[0]) {
          fields[field] = messages[0];
        }
      });

      next(new AppError(400, "VALIDATION_ERROR", "Input validation failed", fields));
      return;
    }

    req.validated = { ...req.validated, [target]: result.data };
    if (target !== "query") {
      req[target] = result.data;
    }
    next();
  };
