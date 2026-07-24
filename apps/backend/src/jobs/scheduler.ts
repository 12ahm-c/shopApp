import cron from "node-cron";
import { cleanupJob } from "./cleanup.job";
import { morningGreetingJob } from "./morningGreeting.job";
import { dailySummaryPushJob } from "./dailySummaryPush.job";
import { lowStockPushJob } from "./lowStockPush.job";
import { outOfStockJob } from "./outOfStock.job";
import { stagnantProductsJob } from "./stagnantProducts.job";
import { log } from "../utils/logger";

export const startScheduler = (): void => {
  // 1. Morning greeting at 10:00 UTC daily
  cron.schedule("0 10 * * *", () => {
    log("info", "Starting morning greeting job");
    morningGreetingJob();
  }, { timezone: "Etc/UTC" });

  // 2. Low stock + Out of stock — once daily at 13:00 UTC
  cron.schedule("0 13 * * *", () => {
    log("info", "Starting low stock push job");
    lowStockPushJob();
  }, { timezone: "Etc/UTC" });

  cron.schedule("5 13 * * *", () => {
    log("info", "Starting out of stock job");
    outOfStockJob();
  }, { timezone: "Etc/UTC" });

  // 3. Daily summary report at 21:00 UTC
  cron.schedule("0 21 * * *", () => {
    log("info", "Starting daily summary push job");
    dailySummaryPushJob();
  }, { timezone: "Etc/UTC" });

  // 4. Stagnant products — 1st of each month at 08:00 UTC
  cron.schedule("0 8 1 * *", () => {
    log("info", "Starting stagnant products job");
    stagnantProductsJob();
  }, { timezone: "Etc/UTC" });

  // 5. Cleanup old logs — 2nd of each month at 02:00 UTC
  cron.schedule("0 2 2 * *", () => {
    log("info", "Starting cleanup job");
    cleanupJob();
  }, { timezone: "Etc/UTC" });

  log("info", "Cron scheduler started");
};
