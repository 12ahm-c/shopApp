import mongoose from "mongoose";
import { notificationService } from "../modules/notification/notification.service";
import { Product } from "../modules/product/product.model";
import { User } from "../modules/user/user.model";
import { notifText } from "./notifText";
import { log } from "../utils/logger";

export const stagnantProductsJob = async (): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const soldProductIds = await mongoose.connection.collection("sales").aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, isDeleted: false } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId" } }
    ]).toArray();

    const soldIds = new Set(soldProductIds.map((p: any) => p._id.toString()));

    const allProducts = await Product.find({ quantity: { $gt: 0 } }).lean();

    const stagnantProducts = allProducts.filter((p) => !soldIds.has(p._id.toString()));

    if (stagnantProducts.length === 0) return;

    const admins = await User.find({ role: "admin" }).lean();
    const t = await notifText();

    for (const admin of admins) {
      const productList = stagnantProducts
        .slice(0, 5)
        .map((p) => `${p.name} (المخزون: ${p.quantity})`)
        .join("، ");
      const moreText = stagnantProducts.length > 5
        ? ` و ${stagnantProducts.length - 5} منتجات أخرى`
        : "";

      await notificationService.createNotification(
        admin._id.toString(),
        "stagnant_products",
        t.stagnantTitle(stagnantProducts.length),
        t.stagnantBody(productList, moreText),
        {
          type: "stagnant_products",
          productCount: stagnantProducts.length,
          products: stagnantProducts.slice(0, 10).map((p) => ({
            id: p._id.toString(),
            name: p.name,
            quantity: p.quantity
          }))
        }
      );
    }

    log("info", "Stagnant products job completed", { productCount: stagnantProducts.length });
  } catch (error) {
    log("error", "Stagnant products job failed", { message: (error as Error).message });
  }
};
