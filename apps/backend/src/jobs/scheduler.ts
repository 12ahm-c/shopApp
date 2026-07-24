import cron from "node-cron";
import { dailySummaryJob } from "./dailySummary.job";
import { lowStockAlertJob } from "./lowStockAlert.job";
import { cleanupJob } from "./cleanup.job";
import { morningGreetingJob } from "./morningGreeting.job";
import { dailySummaryPushJob } from "./dailySummaryPush.job";
import { lowStockPushJob } from "./lowStockPush.job";
import { outOfStockJob } from "./outOfStock.job";
import { stagnantProductsJob } from "./stagnantProducts.job";
import { log } from "../utils/logger";

export const startScheduler = (): void => {
  // Morning greeting at 10:00 UTC daily
  cron.schedule("0 10 * * *", () => {
    log("info", "Starting morning greeting job");
    morningGreetingJob();
  }, { timezone: "Etc/UTC" });

  // Low stock alerts every hour
  cron.schedule("0 * * * *", () => {
    log("info", "Starting low stock alert job");
    lowStockAlertJob();
  });

  // Out of stock alerts every hour (at :30)
  cron.schedule("30 * * * *", () => {
    log("info", "Starting out of stock job");
    outOfStockJob();
  });

  // Low stock push notification at 13:00 UTC daily
  cron.schedule("0 13 * * *", () => {
    log("info", "Starting low stock push job");
    lowStockPushJob();
  }, { timezone: "Etc/UTC" });

  // Daily summary (yesterday) at midnight UTC
  cron.schedule("0 0 * * *", () => {
    log("info", "Starting daily summary job");
    dailySummaryJob();
  });

  // Daily summary push (today report) at 21:00 UTC
  cron.schedule("0 21 * * *", () => {
    log("info", "Starting daily summary push job");
    dailySummaryPushJob();
  }, { timezone: "Etc/UTC" });

  // Stagnant products check monthly (1st of each month at 08:00 UTC)
  cron.schedule("0 8 1 * *", () => {
    log("info", "Starting stagnant products job");
    stagnantProductsJob();
  }, { timezone: "Etc/UTC" });

  // Cleanup old logs monthly (2nd of each month at 02:00 UTC)
  cron.schedule("0 2 2 * *", () => {
    log("info", "Starting cleanup job");
    cleanupJob();
  }, { timezone: "Etc/UTC" });

  log("info", "Cron scheduler started");
};
