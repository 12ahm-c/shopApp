import cors from "cors";
import express from "express";
import { authRoutes } from "./modules/auth/auth.routes";
import { employeeRoutes } from "./modules/employee/employee.routes";
import { userRoutes } from "./modules/user/user.routes";
import { productRoutes } from "./modules/product/product.routes";
import { customerRoutes } from "./modules/customer/customer.routes";
import { supplierRoutes } from "./modules/supplier/supplier.routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" }, error: null, meta: null });
  });

  app.use("/v1/auth", authRoutes);
  app.use("/v1/users", userRoutes);
  app.use("/v1/employees", employeeRoutes);
  app.use("/v1/products", productRoutes);
  app.use("/v1/customers", customerRoutes);
  app.use("/v1/suppliers", supplierRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
