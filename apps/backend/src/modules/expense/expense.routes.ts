import { Router } from "express";
import { expenseController } from "./expense.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createExpenseSchema, updateExpenseSchema, expenseListQuerySchema } from "./expense.validation";

const router = Router();

// All expense routes are admin only
router.use(requireAuth, requireRole("admin"));

router.get("/", validate(expenseListQuerySchema, "query"), expenseController.getExpenses);
router.post("/", validate(createExpenseSchema), expenseController.createExpense);
router.put("/:id", validate(updateExpenseSchema), expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

export default router;
