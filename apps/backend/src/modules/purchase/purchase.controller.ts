import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { purchaseService } from "./purchase.service";
import type { CreatePurchaseInput, PurchaseListQuery } from "./purchase.validation";

export const purchaseController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await purchaseService.createPurchase(
      req.body as CreatePurchaseInput,
      req.user!.userId,
      ""
    );
    successResponse(res, data, 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await purchaseService.listPurchases(req.validated?.query as PurchaseListQuery);
    successResponse(res, result.data, 200, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await purchaseService.getPurchaseById(String(req.params.id));
    successResponse(res, data);
  })
};
