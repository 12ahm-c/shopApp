import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { expenseController } from "./expense.controller";
import { createExpenseSchema, updateExpenseSchema, expenseListQuerySchema } from "./expense.validation";

export const expenseRoutes = Router();

expenseRoutes.use(requireAuth, requireRole("admin"));

expenseRoutes.post("/", validate(createExpenseSchema), expenseController.create);
expenseRoutes.get("/", validate(expenseListQuerySchema, "query"), expenseController.list);
expenseRoutes.get("/:id", expenseController.getById);
expenseRoutes.put("/:id", validate(updateExpenseSchema), expenseController.update);
expenseRoutes.delete("/:id", expenseController.delete);
