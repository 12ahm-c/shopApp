import { notificationService } from "../modules/notification/notification.service";
import { sendPushToAllAdmins, isPushEnabled } from "../utils/fcm";
import { Product } from "../modules/product/product.model";
import { User } from "../modules/user/user.model";
import { log } from "../utils/logger";

export const lowStockPushJob = async (): Promise<void> => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$quantity", "$alertThreshold"] }
    }).lean();

    if (lowStockProducts.length === 0) return;

    const admins = await User.find({ role: "admin" }).lean();

    const productList = lowStockProducts
      .slice(0, 5)
      .map((p) => `${p.name} (${p.quantity})`)
      .join(", ");
    const moreText = lowStockProducts.length > 5
      ? ` و ${lowStockProducts.length - 5} منتجات أخرى`
      : "";

    for (const admin of admins) {
      const title = `⚠️ منتجات قاربت النفاد (${lowStockProducts.length})`;
      const body = `${productList}${moreText}`;

      await notificationService.createNotification(
        admin._id.toString(),
        "low_stock",
        title,
        body,
        {
          type: "low_stock_push",
          productCount: lowStockProducts.length,
          products: lowStockProducts.map((p) => ({
            id: p._id.toString(),
            name: p.name,
            quantity: p.quantity,
            threshold: p.alertThreshold
          }))
        }
      );
    }

    if (isPushEnabled()) {
      await sendPushToAllAdmins(
        `⚠️ ${lowStockProducts.length} منتجات قاربت النفاد`,
        productList + moreText,
        { url: "/products" }
      );
    }

    log("info", "Low stock push job completed", { productCount: lowStockProducts.length });
  } catch (error) {
    log("error", "Low stock push job failed", { message: (error as Error).message });
  }
};
