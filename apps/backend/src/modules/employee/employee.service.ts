import { Types } from "mongoose";
import { User } from "../user/user.model";
import { AppError } from "../../utils/AppError";
import { hashPassword } from "../../utils/password.util";
import { serializeUser } from "../../utils/serializer";
import type {
  AttendanceInput,
  CreateEmployeeInput,
  EmployeeListQuery,
  UpdateEmployeeInput
} from "./employee.validation";

const ensureObjectId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "NOT_FOUND", "Employee does not exist");
  }
};

const duplicateError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

export const employeeService = {
  async createEmployee(input: CreateEmployeeInput) {
    try {
      const employee = await User.create({
        name: input.name,
        phone: input.phone,
        passwordHash: await hashPassword(input.password),
        salary: input.salary,
        role: "employee"
      });

      return serializeUser(employee, { includeEmployment: true });
    } catch (error) {
      if (duplicateError(error)) {
        throw new AppError(409, "DUPLICATE", "Phone already registered");
      }
      throw error;
    }
  },

  async getEmployees(query: EmployeeListQuery) {
    const filter: Record<string, unknown> = { role: "employee" };
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { phone: { $regex: query.search, $options: "i" } }
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [employees, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      User.countDocuments(filter)
    ]);

    return {
      data: employees.map((employee) => serializeUser(employee, { includeEmployment: true })),
      meta: { page: query.page, limit: query.limit, total }
    };
  },

  async getEmployeeById(id: string) {
    ensureObjectId(id);
    const employee = await User.findOne({ _id: id, role: "employee" });
    if (!employee) {
      throw new AppError(404, "NOT_FOUND", "Employee does not exist");
    }
    return serializeUser(employee, { includeEmployment: true });
  },

  async updateEmployee(id: string, input: UpdateEmployeeInput) {
    ensureObjectId(id);
    const employee = await User.findOne({ _id: id, role: "employee" }).select("+refreshTokens");
    if (!employee) {
      throw new AppError(404, "NOT_FOUND", "Employee does not exist");
    }

    if (input.name !== undefined) employee.name = input.name;
    if (input.phone !== undefined) employee.phone = input.phone;
    if (input.salary !== undefined) employee.salary = input.salary;
    if (input.password !== undefined) {
      employee.passwordHash = await hashPassword(input.password);
      employee.refreshTokens.forEach((token) => {
        if (!token.revokedAt) token.revokedAt = new Date();
      });
    }

    try {
      await employee.save();
      return serializeUser(employee, { includeEmployment: true });
    } catch (error) {
      if (duplicateError(error)) {
        throw new AppError(409, "DUPLICATE", "Phone already registered");
      }
      throw error;
    }
  },

  async markAttendance(id: string, input: AttendanceInput) {
    ensureObjectId(id);
    const date = new Date(input.date);
    date.setUTCHours(0, 0, 0, 0);

    const employee = await User.findOne({ _id: id, role: "employee" });
    if (!employee) {
      throw new AppError(404, "NOT_FOUND", "Employee does not exist");
    }

    const existing = employee.attendance.find(
      (entry) => entry.date.toISOString() === date.toISOString()
    );

    if (existing) {
      existing.status = input.status;
    } else {
      employee.attendance.push({ date, status: input.status });
    }

    await employee.save();

    return {
      userId: employee._id.toString(),
      date: date.toISOString(),
      status: input.status,
      allAttendance: employee.attendance.map((entry) => ({
        date: entry.date.toISOString(),
        status: entry.status
      }))
    };
  }
};
