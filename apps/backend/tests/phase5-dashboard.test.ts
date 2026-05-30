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
import { getNextInvoiceNumber } from "../src/utils/counter.util";

const hasMongoUri = Boolean(process.env.MONGODB_URI);
const describeWithDb = hasMongoUri ? describe : describe.skip;

jest.setTimeout(30000);

const uniqueDigits = () => String(Math.floor(10000000 + Math.random() * 89999999));
const phone = () => `+222${uniqueDigits()}`;

const createTestUser = async (role: "admin" | "employee") => {
  return User.create({
    name: `${role} test user`,
    phone: phone(),
    passwordHash: await hashPassword("secret1"),
    role,
    salary: 0
  });
};

describeWithDb("Phase 5 — Dashboard", () => {
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
    await mongoose.connection.collection("counters").deleteOne({ _id: "invoiceNumber" as any });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const trackUser = <T extends { phone: string }>(entity: T): T => {
    createdPhones.add(entity.phone);
    return entity;
  };

  const login = async (user: { phone: string }) => {
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ phone: user.phone, password: "secret1" })
      .expect(200);
    return res.body.data.accessToken;
  };

  const createProduct = async (name: string, quantity = 20) => {
    return Product.create({ name, category: "Test", price: 500, quantity, alertThreshold: 5 });
  };

  const createSale = async (token: string, productId: string, quantity: number) => {
    return request(app)
      .post("/v1/sales")
      .set("Authorization", `Bearer ${token}`)
      .send({ items: [{ productId, quantity, unitPrice: 500 }], customerName: "Dash Test", paymentMethod: "cash" })
      .expect(201);
  };

  it("admin dashboard returns full stats shape", async () => {
    const admin = trackUser(await createTestUser("admin"));
    const token = await login(admin);

    const product = await createProduct("Dash Product", 10);
    await createSale(token, product._id.toString(), 2);

    const res = await request(app)
      .get("/v1/dashboard/admin")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.todaySales).toBeGreaterThanOrEqual(1000);
    expect(res.body.data.stats.todayOrders).toBeGreaterThanOrEqual(1);
    expect(res.body.data.stats.totalProducts).toBeGreaterThanOrEqual(1);
    expect(res.body.data.stats.lowStockCount).toBeGreaterThanOrEqual(0);
    expect(res.body.data.stats.totalEmployees).toBeGreaterThanOrEqual(0);
    expect(res.body.data.stats.outstandingDebt).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.body.data.recentSales)).toBe(true);
    expect(Array.isArray(res.body.data.lowStockProducts)).toBe(true);
    expect(Array.isArray(res.body.data.recentActivity)).toBe(true);
  });

  it("employee dashboard returns own stats shape", async () => {
    const admin = trackUser(await createTestUser("admin"));
    const emp = trackUser(await createTestUser("employee"));
    const adminToken = await login(admin);
    const empToken = await login(emp);

    const product = await createProduct("Emp Product", 10);
    await createSale(adminToken, product._id.toString(), 3);

    const res = await request(app)
      .get("/v1/dashboard/employee")
      .set("Authorization", `Bearer ${empToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.todaySales).toBeGreaterThanOrEqual(0);
    expect(res.body.data.stats.todayOrders).toBeGreaterThanOrEqual(0);
    expect(res.body.data.stats.monthlySales).toBeGreaterThanOrEqual(0);
    expect(res.body.data.stats.monthlyOrders).toBeGreaterThanOrEqual(0);
    expect(res.body.data.stats.averageTicket).toBeGreaterThanOrEqual(0);
    expect(res.body.data.unreadNotifications).toBeGreaterThanOrEqual(0);
  });

  it("employee cannot access admin dashboard", async () => {
    const emp = trackUser(await createTestUser("employee"));
    const token = await login(emp);

    await request(app)
      .get("/v1/dashboard/admin")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("admin cannot access employee dashboard", async () => {
    const admin = trackUser(await createTestUser("admin"));
    const token = await login(admin);

    await request(app)
      .get("/v1/dashboard/employee")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });
});
