import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { userService } from "./user.service";
import type { UpdateProfileInput } from "./user.validation";

export const userController = {
  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const data = await userService.updateCurrentUser(req.user!.userId, req.body as UpdateProfileInput);
    successResponse(res, data);
  })
};
