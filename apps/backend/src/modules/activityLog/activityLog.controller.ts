import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { activityLogService } from "./activityLog.service";
import type { ActivityLogListQuery } from "./activityLog.validation";

export const activityLogController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await activityLogService.listLogs(
      req.validated?.query as ActivityLogListQuery,
      req.user!
    );
    successResponse(res, result.data, 200, result.meta);
  })
};
