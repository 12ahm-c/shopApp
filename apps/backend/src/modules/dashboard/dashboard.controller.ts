import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  admin: asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.getAdminDashboard();
    successResponse(res, data);
  }),

  employee: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.getEmployeeDashboard(req.user!.userId);
    successResponse(res, data);
  })
};
