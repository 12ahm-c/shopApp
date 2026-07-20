import mongoose from "mongoose";
import { notificationService } from "../modules/notification/notification.service";
import { User } from "../modules/user/user.model";
import { log } from "../utils/logger";

export const dailySummaryPushJob = async (): Promise<void> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const salesResult = await mongoose.connection.collection("sales").aggregate([
      { $match: { createdAt: { $gte: todayStart, $lt: todayEnd }, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          totalCost: { $sum: { $sum: "$items.costPrice" } }
        }
      }
    ]).toArray();

    const summary = salesResult[0] ?? { totalSales: 0, orderCount: 0, totalCost: 0 };
    const netProfit = summary.totalSales - summary.totalCost;

    const expenses = await mongoose.connection.collection("expenses").aggregate([
      { $match: { date: { $gte: todayStart, $lt: todayEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray();

    const totalExpenses = expenses[0]?.total || 0;
    const finalProfit = netProfit - totalExpenses;

    const admins = await User.find({ role: "admin" }).lean();

    for (const admin of admins) {
      const title = "ملخص اليوم 📊";
      const body = [
        `المبيعات: ${summary.totalSales} MRU`,
        `الفواتير: ${summary.orderCount}`,
        `صافي الربح: ${finalProfit} MRU`,
        `المصروفات: ${totalExpenses} MRU`
      ].join(" | ");

      await notificationService.createNotification(
        admin._id.toString(),
        "daily_summary",
        title,
        body,
        {
          type: "daily_summary_push",
          totalSales: summary.totalSales,
          orderCount: summary.orderCount,
          netProfit: finalProfit,
          totalExpenses
        }
      );
    }

    log("info", "Daily summary push job completed", {
      totalSales: summary.totalSales,
      orderCount: summary.orderCount,
      netProfit: finalProfit
    });
  } catch (error) {
    log("error", "Daily summary push job failed", { message: (error as Error).message });
  }
};
