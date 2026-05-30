import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/database";
import { Sale } from "../src/modules/sale/sale.model";
import { Product } from "../src/modules/product/product.model";
import { Customer } from "../src/modules/customer/customer.model";
import { User } from "../src/modules/user/user.model";
import { Notification } from "../src/modules/notification/notification.model";
import { hashPassword } from "../src/utils/password.util";

const hasMongoUri = Boolean(process.env.MONGODB_URI);
const describeWithDb = hasMongoUri ? describe : describe.skip;

jest.setTimeout(30000);

const uniqueDigits = () => String(Math.floor(10000000 + Math.random() * 89999999));
const phone = () => `+222${uniqueDigits()}`;

const createTestUser = async (role: "admin" | "employee", overrides: Partial<{ name: string; phone: string }> = {}) => {
  return User.create({
    name: overrides.name ?? `${role} test user`,
    phone: overrides.phone ?? phone(),
    passwordHash: await hashPassword("secret1"),
    role,
    salary: 0
  });
};

describeWithDb("Phase 6 — Critical Flow Integration Tests", () => {
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
    await Sale.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Notification.deleteMany({});
    await mongoose.connection.collection("activity_logs").deleteMany({});
    await mongoose.connection.collection("counters").deleteOne({ _id: "invoiceNumber" as any });
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
    return res.body.data;
  };

  const productName = () => `Critical-${uniqueDigits()}`;

  describe("Login flow", () => {
    it("successful login returns user + tokens", async () => {
      const user = trackUser(await createTestUser("employee"));
      const data = await login(user);
      expect(data.user).toBeDefined();
      expect(data.accessToken).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      expect(data.accessTokenExpiresAt).toBeDefined();
      expect(data.refreshTokenExpiresAt).toBeDefined();
    });

    it("wrong phone returns 401", async () => {
      await request(app)
        .post("/v1/auth/login")
        .send({ phone: "+22200000000", password: "secret1" })
        .expect(401);
    });

    it("wrong password returns 401", async () => {
      const user = trackUser(await createTestUser("employee"));
      await request(app)
        .post("/v1/auth/login")
        .send({ phone: user.phone, password: "wrongpass" })
        .expect(401);
    });
  });

  describe("Sale + stock decrement", () => {
    it("sale decrements product quantity", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const { accessToken } = await login(admin);

      const product = await Product.create({ name: productName(), category: "Test", price: 500, quantity: 10, alertThreshold: 5 });

      const res = await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ items: [{ productId: product._id.toString(), quantity: 3, unitPrice: 500 }], customerName: "Flow Test", paymentMethod: "cash" })
        .expect(201);

      expect(res.body.data.stockUpdates[0].oldQuantity).toBe(10);
      expect(res.body.data.stockUpdates[0].newQuantity).toBe(7);

      const updated = await Product.findById(product._id);
      expect(updated!.quantity).toBe(7);
    });

    it("INSUFFICIENT_STOCK when quantity exceeds available", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const { accessToken } = await login(admin);

      const product = await Product.create({ name: productName(), category: "Test", price: 500, quantity: 2, alertThreshold: 5 });

      await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ items: [{ productId: product._id.toString(), quantity: 5, unitPrice: 500 }], customerName: "Stock Fail", paymentMethod: "cash" })
        .expect(422)
        .expect((res) => expect(res.body.error.code).toBe("INSUFFICIENT_STOCK"));
    });

    it("stock restored on sale cancellation", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const { accessToken } = await login(admin);

      const product = await Product.create({ name: productName(), category: "Test", price: 500, quantity: 10, alertThreshold: 5 });

      const saleRes = await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ items: [{ productId: product._id.toString(), quantity: 4, unitPrice: 500 }], customerName: "Cancel Flow", paymentMethod: "cash" })
        .expect(201);

      const cancelRes = await request(app)
        .delete(`/v1/sales/${saleRes.body.data.sale._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(cancelRes.body.data.restoredStock[0].newQuantity).toBe(10);

      const updated = await Product.findById(product._id);
      expect(updated!.quantity).toBe(10);
    });
  });

  describe("Debt update", () => {
    it("customer debt increase and decrease works", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const { accessToken } = await login(admin);

      const customer = await Customer.create({ name: "Debt Customer" });

      const increase = await request(app)
        .put(`/v1/customers/${customer._id}/debt`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 5000, type: "increase", note: "Achat" })
        .expect(200);

      expect(increase.body.data.customer.totalDebt).toBe(5000);

      const decrease = await request(app)
        .put(`/v1/customers/${customer._id}/debt`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 2000, type: "decrease", note: "Paiement" })
        .expect(200);

      expect(decrease.body.data.customer.totalDebt).toBe(3000);
    });

    it("decrease > current debt returns VALIDATION_ERROR", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const { accessToken } = await login(admin);

      const customer = await Customer.create({ name: "Debt Limit", totalDebt: 1000 });

      await request(app)
        .put(`/v1/customers/${customer._id}/debt`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 2000, type: "decrease" })
        .expect(422);
    });
  });

  describe("Notification triggers", () => {
    it("low stock notification created after sale", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const { accessToken } = await login(admin);

      const product = await Product.create({ name: productName(), category: "Test", price: 500, quantity: 3, alertThreshold: 5 });

      await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ items: [{ productId: product._id.toString(), quantity: 1, unitPrice: 500 }], customerName: "Notif Test", paymentMethod: "cash" })
        .expect(201);

      const notifs = await Notification.find({ userId: admin._id, type: "low_stock" });
      expect(notifs.length).toBeGreaterThanOrEqual(1);
    });

    it("debt update notification created for admin", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const { accessToken } = await login(admin);

      const customer = await Customer.create({ name: "Notif Customer" });

      await request(app)
        .put(`/v1/customers/${customer._id}/debt`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ amount: 3000, type: "increase" })
        .expect(200);

      const notifs = await Notification.find({ userId: admin._id, type: "debt_updated" });
      expect(notifs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
