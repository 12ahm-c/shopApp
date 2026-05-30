import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { customerController } from "./customer.controller";
import { createCustomerSchema, customerListQuerySchema, debtSchema } from "./customer.validation";

export const customerRoutes = Router();

customerRoutes.use(requireAuth, requireRole("admin"));

customerRoutes.post("/", validate(createCustomerSchema), customerController.create);
customerRoutes.get("/", validate(customerListQuerySchema, "query"), customerController.list);
customerRoutes.get("/:id", customerController.getById);
customerRoutes.put("/:id/debt", validate(debtSchema), customerController.updateDebt);
customerRoutes.delete("/:id", customerController.delete);
