import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { notificationController } from "./notification.controller";
import { notificationListQuerySchema } from "./notification.validation";

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

notificationRoutes.get(
  "/",
  validate(notificationListQuerySchema, "query"),
  notificationController.list
);
notificationRoutes.patch("/read-all", notificationController.markAllRead);
notificationRoutes.patch("/:id/read", notificationController.markRead);
