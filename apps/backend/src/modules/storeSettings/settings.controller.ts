import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { settingsService } from "./settings.service";
import type { UpdateSettingsInput } from "./settings.validation";

export const settingsController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    const data = await settingsService.getSettings();
    successResponse(res, data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await settingsService.updateSettings(req.body as UpdateSettingsInput);
    successResponse(res, data);
  })
};
