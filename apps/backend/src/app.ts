import cors from "cors";
import express from "express";
import { authRoutes } from "./modules/auth/auth.routes";
import { employeeRoutes } from "./modules/employee/employee.routes";
import { userRoutes } from "./modules/user/user.routes";
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
