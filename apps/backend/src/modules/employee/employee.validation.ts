import { z } from "zod";
import { isValidPhone, normalizePhone } from "../../utils/phone.util";

const phoneSchema = z.string().transform(normalizePhone).refine(isValidPhone, "Invalid phone number");

export const createEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema,
  password: z.string().min(6),
  salary: z.number().int().min(0).optional().default(0),
  role: z.literal("employee")
});

export const updateEmployeeSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    phone: phoneSchema.optional(),
    salary: z.number().int().min(0).optional(),
    password: z.string().min(6).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const attendanceSchema = z.object({
  date: z.string().datetime(),
  status: z.enum(["present", "absent"])
});

export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional()
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
