import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { saleController } from "./sale.controller";
import { createSaleSchema, saleListQuerySchema, objectIdParamSchema } from "./sale.validation";

export const saleRoutes = Router();

saleRoutes.post("/", requireAuth, requireRole("admin", "employee"), validate(createSaleSchema), saleController.create);
saleRoutes.get("/", requireAuth, validate(saleListQuerySchema, "query"), saleController.list);
saleRoutes.get("/:id", requireAuth, validate(objectIdParamSchema, "params"), saleController.getById);
saleRoutes.delete("/:id", requireAuth, requireRole("admin"), validate(objectIdParamSchema, "params"), saleController.cancel);
