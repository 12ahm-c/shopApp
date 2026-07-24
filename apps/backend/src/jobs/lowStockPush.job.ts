import { notificationService } from "../modules/notification/notification.service";
import { Product } from "../modules/product/product.model";
import { User } from "../modules/user/user.model";
import { notifText } from "./notifText";
import { log } from "../utils/logger";

export const lowStockPushJob = async (): Promise<void> => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$quantity", "$alertThreshold"] }
    }).lean();

    if (lowStockProducts.length === 0) return;

    const admins = await User.find({ role: "admin" }).lean();
    const t = await notifText();

    for (const admin of admins) {
      const productList = lowStockProducts
        .slice(0, 5)
        .map((p) => `${p.name} (بقي ${p.quantity})`)
        .join("، ");
      const moreText = lowStockProducts.length > 5
        ? ` و ${lowStockProducts.length - 5} منتجات أخرى`
        : "";

      await notificationService.createNotification(
        admin._id.toString(),
        "low_stock",
        t.lowStockTitle(lowStockProducts.length),
        t.lowStockPushBody(productList, moreText),
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

    log("info", "Low stock push job completed", { productCount: lowStockProducts.length });
  } catch (error) {
    log("error", "Low stock push job failed", { message: (error as Error).message });
  }
};
