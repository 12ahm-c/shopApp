import { notificationService } from "../modules/notification/notification.service";
import { Product } from "../modules/product/product.model";
import { User } from "../modules/user/user.model";
import { notifText } from "./notifText";
import { log } from "../utils/logger";

export const outOfStockJob = async (): Promise<void> => {
  try {
    const outOfStockProducts = await Product.find({ quantity: 0 }).lean();

    if (outOfStockProducts.length === 0) return;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const admins = await User.find({ role: "admin" }).lean();
    const t = await notifText();

    for (const admin of admins) {
      for (const prod of outOfStockProducts) {
        const existing = await notificationService.hasRecentNotification(
          admin._id.toString(),
          "out_of_stock",
          prod._id.toString(),
          oneDayAgo
        );

        if (existing) continue;

        await notificationService.createNotification(
          admin._id.toString(),
          "out_of_stock",
          t.outOfStockTitle(prod.name),
          t.outOfStockBody(prod.name),
          { productId: prod._id.toString() }
        );
      }
    }

    log("info", "Out of stock job processed", { productCount: outOfStockProducts.length });
  } catch (error) {
    log("error", "Out of stock job failed", { message: (error as Error).message });
  }
};
