import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/database";
import { User } from "../src/modules/user/user.model";
import { Notification } from "../src/modules/notification/notification.model";
import { hashPassword } from "../src/utils/password.util";

const hasMongoUri = Boolean(process.env.MONGODB_URI);
const describeWithDb = hasMongoUri ? describe : describe.skip;

jest.setTimeout(30000);

const uniqueDigits = () => String(Math.floor(10000000 + Math.random() * 89999999));
const phone = () => `+222${uniqueDigits()}`;

const createTestUser = async (
  role: "admin" | "employee",
  overrides: Partial<{ name: string; phone: string; password: string }> = {}
) => {
  const password = overrides.password ?? "secret1";
  return User.create({
    name: overrides.name ?? `${role} test user`,
    phone: overrides.phone ?? phone(),
    passwordHash: await hashPassword(password),
    role,
    salary: 0
  });
};

describeWithDb("Phase 4 — Activity Logs & Notifications", () => {
  const app = createApp();
  const createdPhones = new Set<string>();

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-access-secret";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";
    await connectDatabase();
  }, 30000);

  afterEach(async () => {
    const collection = mongoose.connection.collection("activity_logs");
    await collection.deleteMany({});

    const notifUserIds = [...createdPhones].map(() => new mongoose.Types.ObjectId());
    await Notification.deleteMany({});

    if (createdPhones.size > 0) {
      await User.deleteMany({ phone: { $in: [...createdPhones] } });
      createdPhones.clear();
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const trackUser = <T extends { phone: string }>(entity: T): T => {
    createdPhones.add(entity.phone);
    return entity;
  };

  const login = async (user: { phone: string }, password = "secret1") => {
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ phone: user.phone, password })
      .expect(200);
    return res.body.data.accessToken;
  };

  const insertActivityLog = async (
    userId: string,
    userName: string,
    action: string,
    details: string,
    amount: number | null = null,
    timestamp?: Date
  ) => {
    const collection = mongoose.connection.collection("activity_logs");
    await collection.insertOne({
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      action,
      details,
      amount,
      timestamp: timestamp ?? new Date()
    });
  };

  describe("GET /activity-logs", () => {
    it("admin can list all activity logs", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "admin_logs" }));
      const emp = trackUser(await createTestUser("employee", { name: "emp_logs" }));
      const token = await login(admin);

      await insertActivityLog(admin._id.toString(), admin.name, "login", "Admin login");
      await insertActivityLog(emp._id.toString(), emp.name, "sale", "Vente #1001 - 500 MRU", 500);
      await insertActivityLog(emp._id.toString(), emp.name, "logout", "Employee logout");

      const res = await request(app)
        .get("/v1/activity-logs")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.meta).toMatchObject({ page: 1, limit: 20, total: 3 });
    });

    it("employee sees only own activity logs", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "admin_own" }));
      const emp = trackUser(await createTestUser("employee", { name: "emp_own" }));
      const token = await login(emp);

      await insertActivityLog(admin._id.toString(), admin.name, "login", "Admin login");
      await insertActivityLog(emp._id.toString(), emp.name, "sale", "Vente #1002 - 300 MRU", 300);

      const res = await request(app)
        .get("/v1/activity-logs")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].userName).toBe("emp_own");
    });

    it("filters by action", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "admin_filter" }));
      const token = await login(admin);

      await insertActivityLog(admin._id.toString(), admin.name, "login", "Admin login");
      await insertActivityLog(admin._id.toString(), admin.name, "sale", "Vente #1003", 1000);
      await insertActivityLog(admin._id.toString(), admin.name, "logout", "Admin logout");

      const res = await request(app)
        .get("/v1/activity-logs?action=sale")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].action).toBe("sale");
    });

    it("filters by date range", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "admin_date" }));
      const token = await login(admin);

      const oldDate = new Date("2025-01-01T00:00:00.000Z");
      const recentDate = new Date();

      await insertActivityLog(admin._id.toString(), admin.name, "login", "Old login", null, oldDate);
      await insertActivityLog(admin._id.toString(), admin.name, "login", "Recent login", null, recentDate);

      const from = new Date("2025-06-01T00:00:00.000Z").toISOString();
      const res = await request(app)
        .get(`/v1/activity-logs?from=${from}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].details).toBe("Recent login");
    });

    it("rejects unauthenticated requests", async () => {
      await request(app)
        .get("/v1/activity-logs")
        .expect(401);
    });
  });

  describe("GET /notifications", () => {
    it("lists user's notifications with unreadCount in meta", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "notif_admin" }));
      const token = await login(admin);

      await Notification.create([
        { userId: admin._id, type: "low_stock", title: "Stock faible", body: "Test", isRead: false },
        { userId: admin._id, type: "daily_summary", title: "Résumé", body: "Test", isRead: true, readAt: new Date() },
        { userId: admin._id, type: "debt_updated", title: "Dette", body: "Test", isRead: false }
      ]);

      const res = await request(app)
        .get("/v1/notifications")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.meta.unreadCount).toBe(2);
    });

    it("filters unread only", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "notif_filter" }));
      const token = await login(admin);

      await Notification.create([
        { userId: admin._id, type: "low_stock", title: "Stock faible", body: "Test", isRead: false },
        { userId: admin._id, type: "daily_summary", title: "Résumé", body: "Test", isRead: true, readAt: new Date() }
      ]);

      const res = await request(app)
        .get("/v1/notifications?unreadOnly=true")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].isRead).toBe(false);
    });

    it("filters by type", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "notif_type" }));
      const token = await login(admin);

      await Notification.create([
        { userId: admin._id, type: "low_stock", title: "Stock faible", body: "Test" },
        { userId: admin._id, type: "daily_summary", title: "Résumé", body: "Test" }
      ]);

      const res = await request(app)
        .get("/v1/notifications?type=low_stock")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe("low_stock");
    });

    it("rejects unauthenticated requests", async () => {
      await request(app)
        .get("/v1/notifications")
        .expect(401);
    });
  });

  describe("PATCH /notifications/:id/read", () => {
    it("marks a single notification as read", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "mark_admin" }));
      const token = await login(admin);

      const notif = await Notification.create({
        userId: admin._id,
        type: "low_stock",
        title: "Stock faible",
        body: "Test",
        isRead: false
      });

      const res = await request(app)
        .patch(`/v1/notifications/${notif._id}/read`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.isRead).toBe(true);
      expect(res.body.data.readAt).toBeTruthy();
      expect(res.body.data._id).toBe(notif._id.toString());
    });

    it("returns 404 for non-existent notification", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "mark_missing" }));
      const token = await login(admin);

      await request(app)
        .patch(`/v1/notifications/${new mongoose.Types.ObjectId()}/read`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);
    });
  });

  describe("PATCH /notifications/read-all", () => {
    it("marks all unread notifications as read", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "markall_admin" }));
      const token = await login(admin);

      await Notification.create([
        { userId: admin._id, type: "low_stock", title: "A", body: "Test", isRead: false },
        { userId: admin._id, type: "daily_summary", title: "B", body: "Test", isRead: false },
        { userId: admin._id, type: "debt_updated", title: "C", body: "Test", isRead: true, readAt: new Date() }
      ]);

      const res = await request(app)
        .patch("/v1/notifications/read-all")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.updatedCount).toBe(2);

      const remaining = await Notification.countDocuments({ userId: admin._id, isRead: false });
      expect(remaining).toBe(0);
    });
  });
});
