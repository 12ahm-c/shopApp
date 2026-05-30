import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/database";
import { Product } from "../src/modules/product/product.model";
import { Sale } from "../src/modules/sale/sale.model";
import { User } from "../src/modules/user/user.model";
import { hashPassword } from "../src/utils/password.util";
import { getNextInvoiceNumber } from "../src/utils/counter.util";

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

describeWithDb("Phase 3 — Sales (POS)", () => {
  const app = createApp();
  const createdPhones = new Set<string>();
  const createdProductNames = new Set<string>();

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-access-secret";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";
    await connectDatabase();
  }, 30000);

  afterEach(async () => {
    const deletions: Promise<unknown>[] = [];
    if (createdPhones.size > 0) {
      deletions.push(User.deleteMany({ phone: { $in: [...createdPhones] } }));
      createdPhones.clear();
    }
    if (createdProductNames.size > 0) {
      deletions.push(Product.deleteMany({ name: { $in: [...createdProductNames] } }));
      createdProductNames.clear();
    }
    await mongoose.connection.collection("counters").deleteOne({ _id: "invoiceNumber" as any });
    await Promise.all(deletions);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const trackUser = <T extends { phone: string }>(entity: T): T => {
    createdPhones.add(entity.phone);
    return entity;
  };

  const trackProduct = (name: string) => {
    createdProductNames.add(name);
  };

  const productName = () => `Product-${uniqueDigits()}`;

  const createTestProduct = async (name: string, quantity = 20) => {
    trackProduct(name);
    return Product.create({ name, category: "Test", price: 500, quantity, alertThreshold: 5 });
  };

  describe("POST /sales", () => {
    it("creates a sale, decrements stock, and returns invoice with stockUpdates", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);
      const token = adminLogin.body.data.accessToken;

      const product = await createTestProduct(productName(), 10);

      const res = await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ productId: product._id.toString(), quantity: 3, unitPrice: 500 }],
          customerName: "Test Customer",
          paymentMethod: "cash"
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sale.invoiceNumber).toBeGreaterThan(0);
      expect(res.body.data.sale.totalAmount).toBe(1500);
      expect(res.body.data.sale.items).toHaveLength(1);
      expect(res.body.data.sale.items[0].total).toBe(1500);
      expect(res.body.data.sale.paymentMethod).toBe("cash");
      expect(res.body.data.stockUpdates).toHaveLength(1);
      expect(res.body.data.stockUpdates[0].oldQuantity).toBe(10);
      expect(res.body.data.stockUpdates[0].newQuantity).toBe(7);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct!.quantity).toBe(7);
    });

    it("returns INSUFFICIENT_STOCK when quantity exceeds available stock", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);
      const token = adminLogin.body.data.accessToken;

      const product = await createTestProduct(productName(), 2);

      await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ productId: product._id.toString(), quantity: 5, unitPrice: 500 }],
          customerName: "Test Customer",
          paymentMethod: "cash"
        })
        .expect(422)
        .expect((res) => {
          expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
        });
    });

    it("returns 404 for non-existent productId", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);
      const token = adminLogin.body.data.accessToken;

      await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ productId: "65f2a1b3c4d5e6f7a8b9c0d1", quantity: 1, unitPrice: 500 }],
          customerName: "Test Customer",
          paymentMethod: "cash"
        })
        .expect(404);
    });

    it("allows both admin and employee to create sales", async () => {
      const employee = trackUser(await createTestUser("employee", { name: "emp1" }));
      const empLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: employee.phone, password: "secret1" })
        .expect(200);

      const product = await createTestProduct(productName(), 10);

      await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${empLogin.body.data.accessToken}`)
        .send({
          items: [{ productId: product._id.toString(), quantity: 1, unitPrice: 500 }],
          customerName: "Employee Sale",
          paymentMethod: "card"
        })
        .expect(201);
    });

    it("rejects unauthenticated requests", async () => {
      await request(app)
        .post("/v1/sales")
        .send({
          items: [{ productId: "65f2a1b3c4d5e6f7a8b9c0d1", quantity: 1, unitPrice: 500 }],
          customerName: "No Auth",
          paymentMethod: "cash"
        })
        .expect(401);
    });
  });

  describe("GET /sales", () => {
    it("admin sees all sales, employee sees own only", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "admin1" }));
      const emp1 = trackUser(await createTestUser("employee", { name: "emp2" }));
      const emp2 = trackUser(await createTestUser("employee", { name: "emp3" }));

      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);
      const emp1Login = await request(app)
        .post("/v1/auth/login")
        .send({ phone: emp1.phone, password: "secret1" })
        .expect(200);
      const emp2Login = await request(app)
        .post("/v1/auth/login")
        .send({ phone: emp2.phone, password: "secret1" })
        .expect(200);

      const product = await createTestProduct(productName(), 50);

      await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${emp1Login.body.data.accessToken}`)
        .send({ items: [{ productId: product._id.toString(), quantity: 1, unitPrice: 500 }], customerName: "S1", paymentMethod: "cash" })
        .expect(201);

      await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${emp2Login.body.data.accessToken}`)
        .send({ items: [{ productId: product._id.toString(), quantity: 2, unitPrice: 500 }], customerName: "S2", paymentMethod: "card" })
        .expect(201);

      const adminSales = await request(app)
        .get("/v1/sales")
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .expect(200);

      expect(adminSales.body.data.length).toBe(2);

      const emp1Sales = await request(app)
        .get("/v1/sales")
        .set("Authorization", `Bearer ${emp1Login.body.data.accessToken}`)
        .expect(200);

      expect(emp1Sales.body.data.length).toBe(1);
      expect(emp1Sales.body.data[0].customerName).toBe("S1");

      const emp2Sales = await request(app)
        .get("/v1/sales")
        .set("Authorization", `Bearer ${emp2Login.body.data.accessToken}`)
        .expect(200);

      expect(emp2Sales.body.data.length).toBe(1);
      expect(emp2Sales.body.data[0].customerName).toBe("S2");
    });
  });

  describe("GET /invoices/:id", () => {
    it("returns full invoice details", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "admin_inv" }));
      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);
      const token = adminLogin.body.data.accessToken;

      const product = await createTestProduct(productName(), 10);
      const saleRes = await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ productId: product._id.toString(), quantity: 1, unitPrice: 500 }],
          customerName: "Invoice Test",
          paymentMethod: "bankily"
        })
        .expect(201);

      const invoiceRes = await request(app)
        .get(`/v1/invoices/${saleRes.body.data.sale._id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(invoiceRes.body.data.invoiceNumber).toBe(saleRes.body.data.sale.invoiceNumber);
      expect(invoiceRes.body.data.totalAmount).toBe(500);
      expect(invoiceRes.body.data.paymentMethod).toBe("bankily");
    });
  });

  describe("DELETE /sales/:id", () => {
    it("admin cancels sale and restores stock", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "admin_cancel" }));
      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);
      const token = adminLogin.body.data.accessToken;

      const product = await createTestProduct(productName(), 10);
      const saleRes = await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ productId: product._id.toString(), quantity: 4, unitPrice: 500 }],
          customerName: "Cancel Test",
          paymentMethod: "cash"
        })
        .expect(201);

      const saleId = saleRes.body.data.sale._id;

      const cancelRes = await request(app)
        .delete(`/v1/sales/${saleId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(cancelRes.body.data.restoredStock).toHaveLength(1);
      expect(cancelRes.body.data.restoredStock[0].oldQuantity).toBe(6);
      expect(cancelRes.body.data.restoredStock[0].newQuantity).toBe(10);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct!.quantity).toBe(10);
    });

    it("returns INVALID_STATE if already cancelled", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "admin_double" }));
      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);
      const token = adminLogin.body.data.accessToken;

      const product = await createTestProduct(productName(), 10);
      const saleRes = await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ productId: product._id.toString(), quantity: 1, unitPrice: 500 }],
          customerName: "Double Cancel",
          paymentMethod: "cash"
        })
        .expect(201);

      const saleId = saleRes.body.data.sale._id;

      await request(app)
        .delete(`/v1/sales/${saleId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      await request(app)
        .delete(`/v1/sales/${saleId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(409)
        .expect((res) => {
          expect(res.body.error.code).toBe("INVALID_STATE");
        });
    });

    it("employee gets 403 when trying to cancel", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "admin_emp_cancel" }));
      const employee = trackUser(await createTestUser("employee", { name: "emp_cancel" }));

      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);
      const empLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: employee.phone, password: "secret1" })
        .expect(200);

      const product = await createTestProduct(productName(), 10);
      const saleRes = await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({
          items: [{ productId: product._id.toString(), quantity: 1, unitPrice: 500 }],
          customerName: "Emp Cancel Test",
          paymentMethod: "cash"
        })
        .expect(201);

      await request(app)
        .delete(`/v1/sales/${saleRes.body.data.sale._id}`)
        .set("Authorization", `Bearer ${empLogin.body.data.accessToken}`)
        .expect(403);
    });
  });

  describe("Invoice numbers", () => {
    it("are sequential across all sales", async () => {
      const admin = trackUser(await createTestUser("admin", { name: "admin_seq" }));
      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);
      const token = adminLogin.body.data.accessToken;

      const product = await createTestProduct(productName(), 100);

      const sale1 = await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ productId: product._id.toString(), quantity: 1, unitPrice: 100 }], customerName: "Seq1", paymentMethod: "cash" })
        .expect(201);

      const sale2 = await request(app)
        .post("/v1/sales")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ productId: product._id.toString(), quantity: 1, unitPrice: 200 }], customerName: "Seq2", paymentMethod: "cash" })
        .expect(201);

      expect(sale2.body.data.sale.invoiceNumber).toBe(sale1.body.data.sale.invoiceNumber + 1);
    });
  });
});
