import { notificationService } from "../modules/notification/notification.service";
import { Product } from "../modules/product/product.model";
import { User } from "../modules/user/user.model";
import { log } from "../utils/logger";

export const lowStockAlertJob = async (): Promise<void> => {
  try {
    const lowStockProducts = await Product.find({ $expr: { $lte: ["$quantity", "$alertThreshold"] } }).lean();

    if (lowStockProducts.length === 0) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const admins = await User.find({ role: "admin" }).lean();

    for (const admin of admins) {
      for (const prod of lowStockProducts) {
        const existing = await notificationService.hasRecentNotification(
          admin._id.toString(),
          "low_stock",
          prod._id.toString(),
          oneHourAgo
        );

        if (existing) continue;

        await notificationService.createNotification(
          admin._id.toString(),
          "low_stock",
          `Stock faible : ${prod.name}`,
          `Il reste ${prod.quantity} unités de ${prod.name}. Seuil: ${prod.alertThreshold}.`,
          { productId: prod._id.toString() }
        );
      }
    }

    log("info", "Low stock alert processed", { productCount: lowStockProducts.length });
  } catch (error) {
    log("error", "Low stock alert job failed", { message: (error as Error).message });
  }
};
