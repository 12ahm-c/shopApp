import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { dashboardController } from "./dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

dashboardRoutes.get("/admin", requireRole("admin"), dashboardController.admin);
dashboardRoutes.get("/employee", requireRole("employee"), dashboardController.employee);
