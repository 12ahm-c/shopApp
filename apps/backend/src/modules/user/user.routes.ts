import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { userController } from "./user.controller";
import { updateProfileSchema } from "./user.validation";

export const userRoutes = Router();

userRoutes.put("/me", requireAuth, validate(updateProfileSchema), userController.updateMe);
