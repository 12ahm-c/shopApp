import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { supplierController } from "./supplier.controller";
import { createSupplierSchema, debtSchema, supplierListQuerySchema, updateSupplierSchema } from "./supplier.validation";

export const supplierRoutes = Router();

supplierRoutes.use(requireAuth, requireRole("admin"));

supplierRoutes.post("/", validate(createSupplierSchema), supplierController.create);
supplierRoutes.get("/", validate(supplierListQuerySchema, "query"), supplierController.list);
supplierRoutes.get("/:id", supplierController.getById);
supplierRoutes.put("/:id", validate(updateSupplierSchema), supplierController.update);
supplierRoutes.put("/:id/debt", validate(debtSchema), supplierController.updateDebt);
supplierRoutes.delete("/:id", supplierController.delete);
