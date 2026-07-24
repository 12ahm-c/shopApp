import { notificationService } from "../modules/notification/notification.service";
import { User } from "../modules/user/user.model";
import { StoreSettings } from "../modules/storeSettings/settings.model";
import { log } from "../utils/logger";

export const morningGreetingJob = async (): Promise<void> => {
  try {
    const settings = await StoreSettings.findOne().lean();
    const storeName = settings?.storeName || "ShopManager";

    const admins = await User.find({ role: "admin" }).lean();

    for (const admin of admins) {
      const title = `صباح الخير، ${admin.name}! ☀️`;
      const body = `مرحباً بك في ${storeName}. نتمنى لك يوماً موفقاً. استخدم التطبيق لإدارة مبيعاتك ومشترياتك بسهولة.`;

      await notificationService.createNotification(
        admin._id.toString(),
        "morning_greeting",
        title,
        body,
        { type: "morning_greeting" }
      );
    }

    log("info", "Morning greeting job completed", { adminCount: admins.length });
  } catch (error) {
    log("error", "Morning greeting job failed", { message: (error as Error).message });
  }
};
