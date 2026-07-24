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
          orderCount: { $sum: 1 }
        }
      }
    ]).toArray();

    const summary = salesResult[0] ?? { totalSales: 0, orderCount: 0 };

    const topProductResult = await mongoose.connection.collection("sales").aggregate([
      { $match: { createdAt: { $gte: todayStart, $lt: todayEnd }, isDeleted: false } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 1 }
    ]).toArray();

    let topProductName = "—";
    if (topProductResult.length > 0) {
      const topProduct = await mongoose.connection.collection("products").findOne(
        { _id: new mongoose.Types.ObjectId(topProductResult[0]._id) }
      );
      if (topProduct) {
        topProductName = topProduct.name;
      }
    }

    const expenses = await mongoose.connection.collection("expenses").aggregate([
      { $match: { date: { $gte: todayStart, $lt: todayEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray();

    const totalExpenses = expenses[0]?.total || 0;

    const admins = await User.find({ role: "admin" }).lean();

    for (const admin of admins) {
      const title = "📊 تقرير اليوم";
      const body = [
        `💰 إجمالي المبيعات: ${summary.totalSales} MRU`,
        `🧾 عدد الفواتير: ${summary.orderCount}`,
        `🏆 أكثر منتج مبيعاً: ${topProductName}`,
        `💸 المصروفات: ${totalExpenses} MRU`
      ].join("\n");

      await notificationService.createNotification(
        admin._id.toString(),
        "daily_summary",
        title,
        body,
        {
          type: "daily_summary_push",
          totalSales: summary.totalSales,
          orderCount: summary.orderCount,
          topProduct: topProductName,
          totalExpenses
        }
      );
    }

    log("info", "Daily summary push job completed", {
      totalSales: summary.totalSales,
      orderCount: summary.orderCount,
      topProduct: topProductName
    });
  } catch (error) {
    log("error", "Daily summary push job failed", { message: (error as Error).message });
  }
};
