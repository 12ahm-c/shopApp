import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { saleService } from "./sale.service";
import type { CreateSaleInput, SaleListQuery } from "./sale.validation";

export const saleController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await saleService.createSale(req.body as CreateSaleInput, req.user!);
    successResponse(res, data, 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await saleService.listSales(req.validated?.query as SaleListQuery, req.user!);
    successResponse(res, result.data, 200, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await saleService.getSaleById(String(req.params.id), req.user!);
    successResponse(res, data);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const data = await saleService.cancelSale(String(req.params.id), req.user!);
    successResponse(res, data);
  }),

  getInvoice: asyncHandler(async (req: Request, res: Response) => {
    const data = await saleService.getSaleById(String(req.params.id), req.user!);
    successResponse(res, data);
  }),

  getPrintData: asyncHandler(async (_req: Request, res: Response) => {
    successResponse(res, { html: null, invoice: null });
  })
};
