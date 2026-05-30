import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { productController } from "./product.controller";
import { createProductSchema, productListQuerySchema, updateProductSchema } from "./product.validation";

export const productRoutes = Router();

productRoutes.get("/", requireAuth, validate(productListQuerySchema, "query"), productController.list);
productRoutes.get("/:id", requireAuth, productController.getById);
productRoutes.post("/", requireAuth, requireRole("admin"), validate(createProductSchema), productController.create);
productRoutes.put("/:id", requireAuth, requireRole("admin"), validate(updateProductSchema), productController.update);
productRoutes.delete("/:id", requireAuth, requireRole("admin"), productController.delete);
