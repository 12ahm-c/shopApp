import mongoose, { Types } from "mongoose";
import { Notification, type NotificationDocument, type NotificationType } from "./notification.model";
import { serializeNotification } from "../../utils/serializer";
import { AppError } from "../../utils/AppError";
import type { NotificationListQuery } from "./notification.validation";
import { emitNotification } from "../../socket/notification.socket";
import { sendPushToUser } from "../../utils/fcm";
import { User } from "../user/user.model";

export const notificationService = {
  async listNotifications(query: NotificationListQuery, userId: string) {
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

    if (query.unreadOnly) {
      filter.isRead = false;
    }
    if (query.type) {
      filter.type = query.type;
    }

    const skip = (query.page - 1) * query.limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: new Types.ObjectId(userId), isRead: false })
    ]);

    return {
      data: notifications.map((n) => serializeNotification(n)),
      meta: { page: query.page, limit: query.limit, total, unreadCount }
    };
  },

  async markAsRead(notificationId: string, userId: string) {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new AppError(404, "NOT_FOUND", "Notification does not exist");
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: new Types.ObjectId(userId) },
      { isRead: true, readAt: new Date() },
      { returnDocument: "after" }
    );

    if (!notification) {
      throw new AppError(404, "NOT_FOUND", "Notification does not exist");
    }

    return {
      _id: notification._id.toString(),
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() ?? null
    };
  },

  async markAllAsRead(userId: string) {
    const result = await Notification.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return { updatedCount: result.modifiedCount };
  },

  async hasRecentNotification(userId: string, type: string, productId: string, since: Date): Promise<boolean> {
    const collection = mongoose.connection.collection("notifications");
    const count = await collection.countDocuments({
      userId: new Types.ObjectId(userId),
      type,
      "data.productId": productId,
      createdAt: { $gte: since }
    });
    return count > 0;
  },

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown> = {}
  ) {
    const notification = await Notification.create({
      userId: new Types.ObjectId(userId),
      type,
      title,
      body,
      data
    });

    const dto = serializeNotification(notification);
    emitNotification(userId, dto);

    sendPushToUser(userId, title, body, Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    )).catch(() => {});

    return dto;
  },

  async registerToken(userId: string, token: string) {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: token }
    });
    return { success: true };
  },

  async removeToken(userId: string, token: string) {
    await User.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: token }
    });
    return { success: true };
  }
};
