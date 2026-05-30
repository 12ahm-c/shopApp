import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { supplierService } from "./supplier.service";
import type { CreateSupplierInput, SupplierDebtInput, SupplierListQuery, UpdateSupplierInput } from "./supplier.validation";

export const supplierController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await supplierService.createSupplier(req.body as CreateSupplierInput);
    successResponse(res, data, 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await supplierService.getSuppliers(req.validated?.query as SupplierListQuery);
    successResponse(res, result.data, 200, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await supplierService.getSupplierById(String(req.params.id));
    successResponse(res, data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await supplierService.updateSupplier(String(req.params.id), req.body as UpdateSupplierInput);
    successResponse(res, data);
  }),

  updateDebt: asyncHandler(async (req: Request, res: Response) => {
    const data = await supplierService.updateDebt(String(req.params.id), req.body as SupplierDebtInput);
    successResponse(res, data);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await supplierService.deleteSupplier(String(req.params.id));
    successResponse(res, null, 204);
  })
};
