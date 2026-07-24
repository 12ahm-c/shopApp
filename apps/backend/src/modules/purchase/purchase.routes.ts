import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { purchaseController } from "./purchase.controller";
import { createPurchaseSchema, purchaseListQuerySchema, purchaseParamSchema } from "./purchase.validation";

export const purchaseRoutes = Router();

purchaseRoutes.use(requireAuth);

purchaseRoutes.post(
  "/",
  requireRole("admin"),
  validate(createPurchaseSchema),
  purchaseController.create
);

purchaseRoutes.get(
  "/",
  validate(purchaseListQuerySchema, "query"),
  purchaseController.list
);

purchaseRoutes.get(
  "/:id",
  validate(purchaseParamSchema, "params"),
  purchaseController.getById
);
