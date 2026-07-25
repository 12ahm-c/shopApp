import cors from "cors";
import express from "express";
import { authRoutes } from "./modules/auth/auth.routes";
import { employeeRoutes } from "./modules/employee/employee.routes";
import { userRoutes } from "./modules/user/user.routes";
import { productRoutes } from "./modules/product/product.routes";
import { customerRoutes } from "./modules/customer/customer.routes";
import { supplierRoutes } from "./modules/supplier/supplier.routes";
import { saleRoutes } from "./modules/sale/sale.routes";
import { invoiceRoutes } from "./modules/sale/invoice.routes";
import { activityLogRoutes } from "./modules/activityLog/activityLog.routes";
import { notificationRoutes } from "./modules/notification/notification.routes";
import { settingsRoutes } from "./modules/storeSettings/settings.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { expenseRoutes } from "./modules/expense/expense.routes";
import { purchaseRoutes } from "./modules/purchase/purchase.routes";
import { requestIdMiddleware } from "./middlewares/requestId.middleware";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

export const createApp = () => {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      time: new Date().toISOString()
    });
  });

  app.use("/v1/auth", authRoutes);
  app.use("/v1/users", userRoutes);
  app.use("/v1/employees", employeeRoutes);
  app.use("/v1/products", productRoutes);
  app.use("/v1/customers", customerRoutes);
  app.use("/v1/suppliers", supplierRoutes);
  app.use("/v1/sales", saleRoutes);
  app.use("/v1/invoices", invoiceRoutes);
  app.use("/v1/activity-logs", activityLogRoutes);
  app.use("/v1/notifications", notificationRoutes);
  app.use("/v1/settings", settingsRoutes);
  app.use("/v1/expenses", expenseRoutes);
  app.use("/v1/purchases", purchaseRoutes);
  app.use("/v1/dashboard", dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
