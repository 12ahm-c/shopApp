import type { UserDocument } from "../types";

export const serializeUser = (
  user: UserDocument,
  options: { includeEmployment?: boolean } = {}
) => {
  const dto: Record<string, unknown> = {
    _id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt ? user.lastActiveAt.toISOString() : null
  };

  if (options.includeEmployment || user.role === "employee") {
    dto.salary = user.salary;
    dto.attendance = user.attendance.map((entry) => ({
      date: entry.date.toISOString(),
      status: entry.status
    }));
  }

  return dto;
};
