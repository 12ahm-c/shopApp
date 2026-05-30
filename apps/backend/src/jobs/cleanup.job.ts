import mongoose from "mongoose";
import { log } from "../utils/logger";

export const cleanupJob = async (): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const activityResult = await mongoose.connection.collection("activity_logs").deleteMany({
      timestamp: { $lt: sixMonthsAgo }
    });

    const notificationResult = await mongoose.connection.collection("notifications").deleteMany({
      createdAt: { $lt: threeMonthsAgo },
      isRead: true
    });

    log("info", "Cleanup completed", {
      deletedActivityLogs: activityResult.deletedCount,
      deletedNotifications: notificationResult.deletedCount
    });
  } catch (error) {
    log("error", "Cleanup job failed", { message: (error as Error).message });
  }
};
