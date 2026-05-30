import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { activityLogController } from "./activityLog.controller";
import { activityLogListQuerySchema } from "./activityLog.validation";

export const activityLogRoutes = Router();

activityLogRoutes.get(
  "/",
  requireAuth,
  validate(activityLogListQuerySchema, "query"),
  activityLogController.list
);
