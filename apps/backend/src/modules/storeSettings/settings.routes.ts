import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { settingsController } from "./settings.controller";
import { updateSettingsSchema } from "./settings.validation";

export const settingsRoutes = Router();

settingsRoutes.use(requireAuth);

settingsRoutes.get("/", settingsController.get);
settingsRoutes.put("/", requireRole("admin"), validate(updateSettingsSchema), settingsController.update);
