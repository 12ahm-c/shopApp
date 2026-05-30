import mongoose from "mongoose";
import { Types } from "mongoose";
import { notificationService } from "../modules/notification/notification.service";
import { Product } from "../modules/product/product.model";
import { User } from "../modules/user/user.model";
import { log } from "../utils/logger";

export const dailySummaryJob = async (): Promise<void> => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const result = await mongoose.connection.collection("sales").aggregate([
      { $match: { createdAt: { $gte: yesterday, $lt: todayStart }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]).toArray();

    const summary = result[0] ?? { total: 0, count: 0 };

    const admins = await User.find({ role: "admin" }).lean();
    for (const admin of admins) {
      await notificationService.createNotification(
        admin._id.toString(),
        "daily_summary",
        "Résumé quotidien",
        `Hier: ${summary.count} ventes pour un total de ${summary.total} MRU.`,
        { date: yesterday.toISOString().split("T")[0], totalSales: summary.total, orderCount: summary.count }
      );
    }

    log("info", "Daily summary sent", { totalSales: summary.total, orderCount: summary.count });
  } catch (error) {
    log("error", "Daily summary job failed", { message: (error as Error).message });
  }
};
