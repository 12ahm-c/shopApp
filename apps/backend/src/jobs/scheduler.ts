import cron from "node-cron";
import { dailySummaryJob } from "./dailySummary.job";
import { lowStockAlertJob } from "./lowStockAlert.job";
import { cleanupJob } from "./cleanup.job";
import { morningGreetingJob } from "./morningGreeting.job";
import { dailySummaryPushJob } from "./dailySummaryPush.job";
import { lowStockPushJob } from "./lowStockPush.job";
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

  cron.schedule("0 10 * * *", () => {
    log("info", "Starting morning greeting push job");
    morningGreetingJob();
  }, { timezone: "Etc/UTC" });

  cron.schedule("0 21 * * *", () => {
    log("info", "Starting daily summary push job");
    dailySummaryPushJob();
  }, { timezone: "Etc/UTC" });

  cron.schedule("0 13 * * *", () => {
    log("info", "Starting low stock push job");
    lowStockPushJob();
  }, { timezone: "Etc/UTC" });

  log("info", "Cron scheduler started");
};
