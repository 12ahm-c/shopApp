import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { authService } from "./auth.service";
import type { LoginInput, RefreshTokenInput } from "./auth.validation";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as LoginInput;
    const data = await authService.login(body.phone, body.password);
    successResponse(res, data);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as RefreshTokenInput;
    const data = await authService.refresh(body.refreshToken);
    successResponse(res, data);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.user!.userId);
    res.status(204).send();
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.me(req.user!.userId);
    successResponse(res, data);
  })
};
