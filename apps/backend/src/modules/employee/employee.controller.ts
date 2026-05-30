import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/apiResponse";
import { employeeService } from "./employee.service";
import type {
  AttendanceInput,
  CreateEmployeeInput,
  EmployeeListQuery,
  UpdateEmployeeInput
} from "./employee.validation";

export const employeeController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await employeeService.createEmployee(req.body as CreateEmployeeInput);
    successResponse(res, data, 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await employeeService.getEmployees(req.validated?.query as EmployeeListQuery);
    successResponse(res, result.data, 200, result.meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await employeeService.getEmployeeById(String(req.params.id));
    successResponse(res, data);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await employeeService.updateEmployee(
      String(req.params.id),
      req.body as UpdateEmployeeInput
    );
    successResponse(res, data);
  }),

  markAttendance: asyncHandler(async (req: Request, res: Response) => {
    const data = await employeeService.markAttendance(String(req.params.id), req.body as AttendanceInput);
    successResponse(res, data);
  })
};
