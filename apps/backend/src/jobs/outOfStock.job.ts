import { notificationService } from "../modules/notification/notification.service";
import { Product } from "../modules/product/product.model";
import { User } from "../modules/user/user.model";
import { log } from "../utils/logger";

export const outOfStockJob = async (): Promise<void> => {
  try {
    const outOfStockProducts = await Product.find({ quantity: 0 }).lean();

    if (outOfStockProducts.length === 0) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const admins = await User.find({ role: "admin" }).lean();

    for (const admin of admins) {
      for (const prod of outOfStockProducts) {
        const existing = await notificationService.hasRecentNotification(
          admin._id.toString(),
          "out_of_stock",
          prod._id.toString(),
          oneHourAgo
        );

        if (existing) continue;

        await notificationService.createNotification(
          admin._id.toString(),
          "out_of_stock",
          `🚫 نفاد المخزون: ${prod.name}`,
          `المنتج "${prod.name}" نفد بالكامل. يرجى إعادة التخزين ASAP.`,
          { productId: prod._id.toString() }
        );
      }
    }

    log("info", "Out of stock job processed", { productCount: outOfStockProducts.length });
  } catch (error) {
    log("error", "Out of stock job failed", { message: (error as Error).message });
  }
};
