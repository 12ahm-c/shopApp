import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { customerService } from "./customer.service";
import type { CreateCustomerInput, CustomerListQuery, DebtInput } from "./customer.validation";

export const customerController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerService.createCustomer(req.body as CreateCustomerInput);
    successResponse(res, data, 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await customerService.getCustomers(req.validated?.query as CustomerListQuery);
    successResponse(res, result.data, 200, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerService.getCustomerById(String(req.params.id));
    successResponse(res, data);
  }),

  updateDebt: asyncHandler(async (req: Request, res: Response) => {
    const data = await customerService.updateDebt(String(req.params.id), req.body as DebtInput, req.user!);
    successResponse(res, data);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await customerService.deleteCustomer(String(req.params.id));
    successResponse(res, null, 204);
  })
};
