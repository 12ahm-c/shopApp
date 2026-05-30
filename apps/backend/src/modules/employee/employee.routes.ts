import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { employeeController } from "./employee.controller";
import {
  attendanceSchema,
  createEmployeeSchema,
  employeeListQuerySchema,
  updateEmployeeSchema
} from "./employee.validation";

export const employeeRoutes = Router();

employeeRoutes.use(requireAuth, requireRole("admin"));
employeeRoutes.post("/", validate(createEmployeeSchema), employeeController.create);
employeeRoutes.get("/", validate(employeeListQuerySchema, "query"), employeeController.list);
employeeRoutes.get("/:id", employeeController.getById);
employeeRoutes.put("/:id", validate(updateEmployeeSchema), employeeController.update);
employeeRoutes.put("/:id/attendance", validate(attendanceSchema), employeeController.markAttendance);
