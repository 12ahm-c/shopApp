import { Types } from "mongoose";
import mongoose from "mongoose";
import { ActivityLog } from "./activityLog.model";
import { serializeActivityLog } from "../../utils/serializer";
import type { ActivityLogListQuery } from "./activityLog.validation";
import type { AuthUser } from "../../types";

export const activityLogService = {
  async listLogs(query: ActivityLogListQuery, user: AuthUser) {
    const filter: Record<string, unknown> = {};

    if (user.role !== "admin") {
      filter.userId = new Types.ObjectId(user.userId);
    } else if (query.userId) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    if (query.action) {
      filter.action = query.action;
    }

    if (query.from || query.to) {
      const dateFilter: Record<string, Date> = {};
      if (query.from) dateFilter.$gte = new Date(query.from);
      if (query.to) dateFilter.$lte = new Date(query.to);
      filter.timestamp = dateFilter;
    }

    const skip = (query.page - 1) * query.limit;
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(query.limit),
      ActivityLog.countDocuments(filter)
    ]);

    return {
      data: logs.map((l) => serializeActivityLog(l)),
      meta: { page: query.page, limit: query.limit, total }
    };
  }
};
