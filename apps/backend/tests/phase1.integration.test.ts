import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/database";
import { employeeService } from "../src/modules/employee/employee.service";
import { authService } from "../src/modules/auth/auth.service";
import { User } from "../src/modules/user/user.model";
import { userService } from "../src/modules/user/user.service";
import { hashPassword } from "../src/utils/password.util";

const hasMongoUri = Boolean(process.env.MONGODB_URI);
const describeWithDb = hasMongoUri ? describe : describe.skip;

jest.setTimeout(30000);

const uniqueDigits = () => String(Math.floor(10000000 + Math.random() * 89999999));
const phone = () => `+222${uniqueDigits()}`;

const createTestUser = async (
  role: "admin" | "employee",
  overrides: Partial<{ name: string; phone: string; password: string; salary: number }> = {}
) => {
  const password = overrides.password ?? "secret1";
  return User.create({
    name: overrides.name ?? `${role} test user`,
    phone: overrides.phone ?? phone(),
    passwordHash: await hashPassword(password),
    role,
    salary: overrides.salary ?? 0
  });
};

describeWithDb("Phase 1 database-backed tasks", () => {
  const app = createApp();
  const createdPhones = new Set<string>();

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-access-secret";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";
    await connectDatabase();
  }, 30000);

  afterEach(async () => {
    if (createdPhones.size > 0) {
      await User.deleteMany({ phone: { $in: [...createdPhones] } });
      createdPhones.clear();
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const track = <T extends { phone: string }>(user: T): T => {
    createdPhones.add(user.phone);
    return user;
  };

  describe("user model", () => {
    it("hashes and validates passwords without selecting passwordHash by default", async () => {
      const user = track(await createTestUser("employee"));
      const withPassword = await User.findById(user._id).select("+passwordHash");
      const withoutPassword = await User.findById(user._id).lean();

      expect(withPassword?.passwordHash).not.toBe("secret1");
      await expect(withPassword!.validatePassword("secret1")).resolves.toBe(true);
      expect(withoutPassword).not.toHaveProperty("passwordHash");
    });

    it("defines the required phone and role indexes", () => {
      const indexes = User.schema.indexes();

      expect(indexes).toEqual(
        expect.arrayContaining([
          [{ phone: 1 }, expect.objectContaining({ unique: true })],
          [{ role: 1 }, expect.any(Object)]
        ])
      );
    });
  });

  describe("auth service", () => {
    it("logs in, rotates refresh tokens, logs out, and rejects revoked tokens", async () => {
      const admin = track(await createTestUser("admin"));

      const login = await authService.login(admin.phone, "secret1");
      expect(login.user).not.toHaveProperty("passwordHash");

      const refreshed = await authService.refresh(login.refreshToken);
      await expect(authService.refresh(login.refreshToken)).rejects.toMatchObject({
        code: "TOKEN_INVALID"
      });

      await authService.logout(admin._id.toString());
      await expect(authService.refresh(refreshed.refreshToken)).rejects.toMatchObject({
        code: "TOKEN_INVALID"
      });
    });

    it("invalidates all refresh tokens after password change", async () => {
      const employee = track(await createTestUser("employee"));
      const login = await authService.login(employee.phone, "secret1");

      await userService.updateCurrentUser(employee._id.toString(), { password: "secret2" });

      await expect(authService.refresh(login.refreshToken)).rejects.toMatchObject({
        code: "TOKEN_INVALID"
      });
      await expect(authService.login(employee.phone, "secret2")).resolves.toHaveProperty(
        "accessToken"
      );
    });

    it("rejects invalid credentials", async () => {
      const employee = track(await createTestUser("employee"));

      await expect(authService.login(employee.phone, "wrong-password")).rejects.toMatchObject({
        code: "AUTH_REQUIRED"
      });
    });
  });

  describe("employee service", () => {
    it("creates, lists, reads, updates, and marks attendance for employees", async () => {
      const employeePhone = phone();
      createdPhones.add(employeePhone);

      const created = await employeeService.createEmployee({
        name: "Employee One",
        phone: employeePhone,
        password: "secret1",
        salary: 12000,
        role: "employee"
      });

      expect(created).toMatchObject({ phone: employeePhone, role: "employee", salary: 12000 });
      expect(created).not.toHaveProperty("passwordHash");

      const list = await employeeService.getEmployees({ page: 1, limit: 20 });
      expect(list.data.some((employee) => employee._id === created._id)).toBe(true);

      const byId = await employeeService.getEmployeeById(String(created._id));
      expect(byId).toMatchObject({ phone: employeePhone });

      const updated = await employeeService.updateEmployee(String(created._id), {
        name: "Employee Updated",
        salary: 14000
      });
      expect(updated).toMatchObject({ name: "Employee Updated", salary: 14000 });

      const attendance = await employeeService.markAttendance(String(created._id), {
        date: "2025-06-16T00:00:00.000Z",
        status: "present"
      });
      expect(attendance).toMatchObject({
        userId: String(created._id),
        date: "2025-06-16T00:00:00.000Z",
        status: "present"
      });
    });

    it("prevents duplicate employee phone numbers", async () => {
      const employeePhone = phone();
      createdPhones.add(employeePhone);

      await employeeService.createEmployee({
        name: "Employee One",
        phone: employeePhone,
        password: "secret1",
        role: "employee",
        salary: 0
      });

      await expect(
        employeeService.createEmployee({
          name: "Employee Two",
          phone: employeePhone,
          password: "secret1",
          role: "employee",
          salary: 0
        })
      ).rejects.toMatchObject({ code: "DUPLICATE" });
    });
  });

  describe("auth endpoints", () => {
    it("supports login, me, refresh rotation, and logout with contract envelopes", async () => {
      const admin = track(await createTestUser("admin"));

      const login = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);

      expect(login.body.success).toBe(true);
      expect(login.body.data.user).not.toHaveProperty("passwordHash");

      await request(app)
        .get("/v1/auth/me")
        .set("Authorization", `Bearer ${login.body.data.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data._id).toBe(admin._id.toString());
        });

      const refreshed = await request(app)
        .post("/v1/auth/refresh")
        .send({ refreshToken: login.body.data.refreshToken })
        .expect(200);

      await request(app)
        .post("/v1/auth/refresh")
        .send({ refreshToken: login.body.data.refreshToken })
        .expect(401)
        .expect((res) => {
          expect(res.body.error.code).toBe("TOKEN_INVALID");
        });

      await request(app)
        .post("/v1/auth/logout")
        .set("Authorization", `Bearer ${refreshed.body.data.accessToken}`)
        .expect(204);
    });

    it("returns AUTH_REQUIRED for invalid login credentials", async () => {
      const employee = track(await createTestUser("employee"));

      await request(app)
        .post("/v1/auth/login")
        .send({ phone: employee.phone, password: "wrong-password" })
        .expect(401)
        .expect((res) => {
          expect(res.body.error.code).toBe("AUTH_REQUIRED");
        });
    });
  });

  describe("user and employee endpoints", () => {
    it("updates own profile and invalidates refresh tokens on password change", async () => {
      const employee = track(await createTestUser("employee"));
      const login = await request(app)
        .post("/v1/auth/login")
        .send({ phone: employee.phone, password: "secret1" })
        .expect(200);

      await request(app)
        .put("/v1/users/me")
        .set("Authorization", `Bearer ${login.body.data.accessToken}`)
        .send({ name: "Profile Updated", password: "secret2" })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.name).toBe("Profile Updated");
          expect(res.body.data).not.toHaveProperty("passwordHash");
        });

      await request(app)
        .post("/v1/auth/refresh")
        .send({ refreshToken: login.body.data.refreshToken })
        .expect(401)
        .expect((res) => {
          expect(res.body.error.code).toBe("TOKEN_INVALID");
        });
    });

    it("enforces admin-only employee management and blocks admin creation via API", async () => {
      const admin = track(await createTestUser("admin"));
      const employee = track(await createTestUser("employee"));

      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);
      const employeeLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: employee.phone, password: "secret1" })
        .expect(200);

      await request(app)
        .get("/v1/employees")
        .set("Authorization", `Bearer ${employeeLogin.body.data.accessToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.error.code).toBe("FORBIDDEN");
        });

      await request(app)
        .post("/v1/employees")
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({
          name: "Bad Admin",
          phone: phone(),
          password: "secret1",
          role: "admin"
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe("VALIDATION_ERROR");
        });

      const employeePhone = phone();
      createdPhones.add(employeePhone);
      const created = await request(app)
        .post("/v1/employees")
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({
          name: "Created Employee",
          phone: employeePhone,
          password: "secret1",
          salary: 1000,
          role: "employee"
        })
        .expect(201);

      expect(created.body.data).not.toHaveProperty("passwordHash");

      await request(app)
        .get("/v1/employees")
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.meta).toEqual(
            expect.objectContaining({ page: 1, limit: 20, total: expect.any(Number) })
          );
        });

      await request(app)
        .get(`/v1/employees/${created.body.data._id}`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .expect(200);

      await request(app)
        .put(`/v1/employees/${created.body.data._id}`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({ salary: 1500 })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.salary).toBe(1500);
        });

      await request(app)
        .put(`/v1/employees/${created.body.data._id}/attendance`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({ date: "2025-06-16T00:00:00.000Z", status: "absent" })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe("absent");
          expect(res.body.data.allAttendance).toEqual(expect.any(Array));
        });
    });
  });
});
