import cron from "node-cron";
import { dailySummaryJob } from "./dailySummary.job";
import { lowStockAlertJob } from "./lowStockAlert.job";
import { cleanupJob } from "./cleanup.job";
import { log } from "../utils/logger";

export const startScheduler = (): void => {
  cron.schedule("0 0 * * *", () => {
    log("info", "Starting daily summary job");
    dailySummaryJob();
  });

  cron.schedule("0 * * * *", () => {
    log("info", "Starting low stock alert job");
    lowStockAlertJob();
  });

  cron.schedule("0 2 * * *", () => {
    log("info", "Starting cleanup job");
    cleanupJob();
  });

  log("info", "Cron scheduler started");
};
