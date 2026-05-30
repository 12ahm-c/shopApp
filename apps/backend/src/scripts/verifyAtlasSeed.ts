import type { Server } from "http";
import type { AddressInfo } from "net";
import mongoose from "mongoose";
import { createApp } from "../app";
import { connectDatabase } from "../config/database";
import { User } from "../modules/user/user.model";

const seedCredentials = {
  admin: { phone: "+22236123456", password: "AdminPass123!" },
  employee: { phone: "+22236123457", password: "EmployeePass123!" },
  secondEmployee: { phone: "+22236123458", password: "EmployeePass456!" }
};

type ApiBody<T> = {
  success: boolean;
  data: T;
  error: null | { code: string; message: string };
  meta: null | { page: number; limit: number; total: number };
};

const fail = (message: string): never => {
  throw new Error(message);
};

const requestJson = async <T>(
  baseUrl: string,
  path: string,
  options: RequestInit & { expectedStatus: number }
): Promise<ApiBody<T>> => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {})
    }
  });

  if (response.status !== options.expectedStatus) {
    const text = await response.text();
    fail(`${path} returned ${response.status}, expected ${options.expectedStatus}: ${text}`);
  }

  if (response.status === 204) {
    return { success: true, data: null as T, error: null, meta: null };
  }

  return (await response.json()) as ApiBody<T>;
};

const login = async (baseUrl: string, phone: string, password: string) => {
  const body = await requestJson<{
    user: { _id: string; phone: string; role: string };
    accessToken: string;
    refreshToken: string;
  }>(baseUrl, "/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
    expectedStatus: 200
  });

  if (!body.success || !body.data.accessToken || !body.data.refreshToken) {
    fail("Login did not return the expected auth payload");
  }

  return body.data;
};

const verifyAtlasSeed = async (): Promise<void> => {
  await connectDatabase();

  const seedPhones = Object.values(seedCredentials).map((credential) => credential.phone);
  const seededUsers = await User.find({ phone: { $in: seedPhones } }).lean();
  if (seededUsers.length !== seedPhones.length) {
    fail("Not all seed users were found in Atlas");
  }

  const userWithoutPassword = await User.findOne({ phone: seedCredentials.admin.phone }).lean();
  if (userWithoutPassword && "passwordHash" in userWithoutPassword) {
    fail("passwordHash is selected by default");
  }

  const indexes = User.schema.indexes() as Array<
    [Record<string, unknown>, { unique?: boolean } | undefined]
  >;
  const hasPhoneUniqueIndex = indexes.some((index) => {
    const fields = index[0];
    const options = index[1];
    return fields.phone === 1 && options?.unique === true;
  });
  const hasRoleIndex = indexes.some((index) => {
    const fields = index[0];
    return fields.role === 1;
  });
  if (!hasPhoneUniqueIndex || !hasRoleIndex) {
    fail("Required users indexes are missing from the model");
  }

  const server: Server = createApp().listen(0);
  const address = server.address();
  if (!address || typeof address === "string") {
    fail("Could not start verification API server");
  }
  const { port } = address as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const adminLogin = await login(
      baseUrl,
      seedCredentials.admin.phone,
      seedCredentials.admin.password
    );
    const employeeLogin = await login(
      baseUrl,
      seedCredentials.employee.phone,
      seedCredentials.employee.password
    );

    const adminMe = await requestJson<{ _id: string; role: string }>(baseUrl, "/v1/auth/me", {
      method: "GET",
      headers: { authorization: `Bearer ${adminLogin.accessToken}` },
      expectedStatus: 200
    });
    if (adminMe.data._id !== adminLogin.user._id || adminMe.data.role !== "admin") {
      fail("Admin /auth/me response does not match the logged-in user");
    }

    await requestJson<null>(baseUrl, "/v1/employees", {
      method: "GET",
      headers: { authorization: `Bearer ${employeeLogin.accessToken}` },
      expectedStatus: 403
    });

    const employees = await requestJson<Array<{ _id: string; phone: string; role: string }>>(
      baseUrl,
      "/v1/employees",
      {
        method: "GET",
        headers: { authorization: `Bearer ${adminLogin.accessToken}` },
        expectedStatus: 200
      }
    );
    const seededEmployee = employees.data.find(
      (employee) => employee.phone === seedCredentials.employee.phone
    );
    if (!seededEmployee) {
      throw new Error("Seeded employee was not retrievable through the admin API");
    }
    if (seededEmployee.role !== "employee") {
      throw new Error("Seeded employee has an unexpected role");
    }
    const seededEmployeeId = seededEmployee._id;

    const employeeDetails = await requestJson<{
      _id: string;
      phone: string;
      salary: number;
      attendance: Array<{ date: string; status: string }>;
    }>(baseUrl, `/v1/employees/${seededEmployeeId}`, {
      method: "GET",
      headers: { authorization: `Bearer ${adminLogin.accessToken}` },
      expectedStatus: 200
    });
    if (employeeDetails.data.attendance.length === 0 || employeeDetails.data.salary <= 0) {
      fail("Seeded employee details are missing salary or attendance data");
    }

    const secondSeededEmployee = employees.data.find(
      (employee) => employee.phone === seedCredentials.secondEmployee.phone
    );
    if (!secondSeededEmployee) {
      throw new Error("Second seeded employee was not retrievable through the admin API");
    }

    await requestJson<null>(baseUrl, "/v1/auth/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${adminLogin.accessToken}` },
      expectedStatus: 204
    });

    console.log(
      JSON.stringify({
        success: true,
        database: mongoose.connection.name,
        verified: {
          atlasDatabase: mongoose.connection.name === "shopAPP",
          seededUsers: seededUsers.length,
          authLogin: true,
          authMe: true,
          employeeReadByAdmin: true,
          employeeBlockedFromAdminRoutes: true,
          passwordHashHiddenByDefault: true,
          indexes: ["phone_unique", "role"]
        }
      })
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

verifyAtlasSeed()
  .catch((error) => {
    console.error(JSON.stringify({ success: false, message: error.message }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
