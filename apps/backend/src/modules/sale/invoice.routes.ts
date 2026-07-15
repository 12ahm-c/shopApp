import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { saleController } from "./sale.controller";
import { objectIdParamSchema } from "./sale.validation";

export const invoiceRoutes = Router();

invoiceRoutes.get("/public/:id", validate(objectIdParamSchema, "params"), saleController.getPublicInvoice);
invoiceRoutes.get("/:id", requireAuth, validate(objectIdParamSchema, "params"), saleController.getInvoice);
invoiceRoutes.get("/print/:id", requireAuth, validate(objectIdParamSchema, "params"), saleController.getPrintData);
