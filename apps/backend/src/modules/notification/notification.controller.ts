import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { notificationService } from "./notification.service";
import type { NotificationListQuery, RegisterTokenBody, RemoveTokenBody } from "./notification.validation";

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.listNotifications(
      req.validated?.query as NotificationListQuery,
      req.user!.userId
    );
    successResponse(res, result.data, 200, result.meta);
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const data = await notificationService.markAsRead(
      String(req.params.id),
      req.user!.userId
    );
    successResponse(res, data);
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const data = await notificationService.markAllAsRead(req.user!.userId);
    successResponse(res, data);
  }),

  registerToken: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.validated?.body as RegisterTokenBody;
    const data = await notificationService.registerToken(req.user!.userId, token);
    successResponse(res, data);
  }),

  removeToken: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.validated?.body as RemoveTokenBody;
    const data = await notificationService.removeToken(req.user!.userId, token);
    successResponse(res, data);
  })
};
