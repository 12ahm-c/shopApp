import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/database";
import { productService } from "../src/modules/product/product.service";
import { customerService } from "../src/modules/customer/customer.service";
import { supplierService } from "../src/modules/supplier/supplier.service";
import { Product } from "../src/modules/product/product.model";
import { Customer } from "../src/modules/customer/customer.model";
import { Supplier } from "../src/modules/supplier/supplier.model";
import { User } from "../src/modules/user/user.model";
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

describeWithDb("Phase 2 — Products, Customers, Suppliers", () => {
  const app = createApp();
  const createdPhones = new Set<string>();
  const createdProductNames = new Set<string>();
  const createdCustomerPhones = new Set<string>();
  const createdSupplierPhones = new Set<string>();

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-access-secret";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";
    await connectDatabase();
  }, 30000);

  afterEach(async () => {
    const phoneDeletions: Promise<unknown>[] = [];
    if (createdPhones.size > 0) {
      phoneDeletions.push(User.deleteMany({ phone: { $in: [...createdPhones] } }));
      createdPhones.clear();
    }
    if (createdProductNames.size > 0) {
      phoneDeletions.push(Product.deleteMany({ name: { $in: [...createdProductNames] } }));
      createdProductNames.clear();
    }
    if (createdCustomerPhones.size > 0) {
      phoneDeletions.push(Customer.deleteMany({ phone: { $in: [...createdCustomerPhones] } }));
      createdCustomerPhones.clear();
    }
    if (createdSupplierPhones.size > 0) {
      phoneDeletions.push(Supplier.deleteMany({ phone: { $in: [...createdSupplierPhones] } }));
      createdSupplierPhones.clear();
    }
    await Promise.all(phoneDeletions);
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

  const trackCustomerPhone = (p: string) => {
    createdCustomerPhones.add(p);
  };

  const trackSupplierPhone = (p: string) => {
    createdSupplierPhones.add(p);
  };

  const productName = () => `Product-${uniqueDigits()}`;

  describe("product service", () => {
    it("creates, lists, reads, updates, and deletes a product", async () => {
      const name = productName();
      trackProduct(name);

      const created = await productService.createProduct({
        name,
        category: "Test",
        price: 1500,
        quantity: 20,
        alertThreshold: 5
      });

      expect(created).toMatchObject({
        name,
        category: "Test",
        price: 1500,
        quantity: 20,
        alertThreshold: 5
      });
      expect(created).not.toHaveProperty("passwordHash");

      const list = await productService.getProducts({ page: 1, limit: 20, lowStock: false });
      expect(list.data.some((p) => p._id === created._id)).toBe(true);

      const byId = await productService.getProductById(String(created._id));
      expect(byId._id).toBe(created._id);

      const updated = await productService.updateProduct(String(created._id), {
        price: 1800,
        quantity: 15
      });
      expect(updated.price).toBe(1800);
      expect(updated.quantity).toBe(15);

      await productService.deleteProduct(String(created._id));
      await expect(productService.getProductById(String(created._id))).rejects.toMatchObject({
        code: "NOT_FOUND"
      });
    });

    it("prevents duplicate product names", async () => {
      const name = productName();
      trackProduct(name);

      await productService.createProduct({
        name,
        category: "Test",
        price: 500,
        quantity: 10,
        alertThreshold: 5
      });

      await expect(
        productService.createProduct({
          name,
          category: "Test",
          price: 600,
          quantity: 5,
          alertThreshold: 5
        })
      ).rejects.toMatchObject({ code: "DUPLICATE" });
    });

    it("filters products by category, lowStock, and search", async () => {
      const name1 = productName();
      const name2 = productName();
      const name3 = productName();
      trackProduct(name1);
      trackProduct(name2);
      trackProduct(name3);

      await productService.createProduct({ name: name1, category: "A", price: 100, quantity: 10, alertThreshold: 5 });
      await productService.createProduct({ name: name2, category: "B", price: 200, quantity: 2, alertThreshold: 5 });
      await productService.createProduct({ name: name3, category: "A", price: 300, quantity: 0, alertThreshold: 5 });

      const catA = await productService.getProducts({ page: 1, limit: 20, category: "A", lowStock: false });
      expect(catA.data.length).toBe(2);

      const lowStock = await productService.getProducts({ page: 1, limit: 20, lowStock: true });
      expect(lowStock.data.length).toBe(2);
      expect(lowStock.data.every((p) => p.quantity <= p.alertThreshold)).toBe(true);

      const search = await productService.getProducts({ page: 1, limit: 20, search: name2, lowStock: false });
      expect(search.data.length).toBe(1);
      expect(search.data[0].name).toBe(name2);
    });
  });

  describe("customer service", () => {
    it("creates, lists, reads, manages debt, and deletes a customer", async () => {
      const customerPhone = phone();
      trackCustomerPhone(customerPhone);

      const created = await customerService.createCustomer({
        name: "Test Customer",
        phone: customerPhone,
        initialDebt: 2000
      });

      expect(created).toMatchObject({
        name: "Test Customer",
        phone: customerPhone,
        totalDebt: 2000
      });
      expect(created.transactions).toHaveLength(1);

      const list = await customerService.getCustomers({ page: 1, limit: 20, hasDebt: false });
      expect(list.data.some((c) => c._id === created._id)).toBe(true);

      const byId = await customerService.getCustomerById(String(created._id));
      expect(byId.customer._id).toBe(created._id);
      expect(byId.recentSales).toEqual([]);

      const debtResult = await customerService.updateDebt(String(created._id), {
        amount: 1500,
        type: "increase",
        note: "Additional purchase"
      });
      expect(debtResult.customer.totalDebt).toBe(3500);
      expect(debtResult.transaction.type).toBe("increase");

      const decreaseResult = await customerService.updateDebt(String(created._id), {
        amount: 1000,
        type: "decrease",
        note: "Payment"
      });
      expect(decreaseResult.customer.totalDebt).toBe(2500);

      await expect(
        customerService.updateDebt(String(created._id), {
          amount: 5000,
          type: "decrease"
        })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

      await customerService.deleteCustomer(String(created._id));
      await expect(customerService.getCustomerById(String(created._id))).rejects.toMatchObject({
        code: "NOT_FOUND"
      });
    });

    it("prevents duplicate customer phone numbers", async () => {
      const customerPhone = phone();
      trackCustomerPhone(customerPhone);

      await customerService.createCustomer({
        name: "Customer One",
        phone: customerPhone,
        initialDebt: 0
      });

      await expect(
        customerService.createCustomer({
          name: "Customer Two",
          phone: customerPhone,
          initialDebt: 0
        })
      ).rejects.toMatchObject({ code: "DUPLICATE" });
    });
  });

  describe("supplier service", () => {
    it("creates, lists, reads, updates, manages debt, and deletes a supplier", async () => {
      const supplierPhone = phone();
      trackSupplierPhone(supplierPhone);

      const created = await supplierService.createSupplier({
        name: "Test Supplier",
        phone: supplierPhone,
        address: "Test Address",
        initialDebt: 5000
      });

      expect(created).toMatchObject({
        name: "Test Supplier",
        phone: supplierPhone,
        address: "Test Address",
        totalDebt: 5000
      });

      const list = await supplierService.getSuppliers({ page: 1, limit: 20, hasDebt: false });
      expect(list.data.some((s) => s._id === created._id)).toBe(true);

      const byId = await supplierService.getSupplierById(String(created._id));
      expect(byId.supplier._id).toBe(created._id);

      const updated = await supplierService.updateSupplier(String(created._id), {
        address: "Updated Address"
      });
      expect(updated.address).toBe("Updated Address");

      const debtResult = await supplierService.updateDebt(String(created._id), {
        amount: 3000,
        type: "increase"
      });
      expect(debtResult.supplier.totalDebt).toBe(8000);

      const decreaseResult = await supplierService.updateDebt(String(created._id), {
        amount: 2000,
        type: "decrease"
      });
      expect(decreaseResult.supplier.totalDebt).toBe(6000);

      await expect(
        supplierService.updateDebt(String(created._id), {
          amount: 10000,
          type: "decrease"
        })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

      await expect(
        supplierService.deleteSupplier(String(created._id))
      ).rejects.toMatchObject({ code: "INVALID_STATE" });

      await supplierService.updateDebt(String(created._id), {
        amount: 6000,
        type: "decrease"
      });

      await supplierService.deleteSupplier(String(created._id));
      await expect(supplierService.getSupplierById(String(created._id))).rejects.toMatchObject({
        code: "NOT_FOUND"
      });
    });
  });

  describe("product endpoints", () => {
    it("enforces auth and role on product CRUD", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const employee = trackUser(await createTestUser("employee"));

      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);

      const employeeLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: employee.phone, password: "secret1" })
        .expect(200);

      const name = productName();
      trackProduct(name);

      const created = await request(app)
        .post("/v1/products")
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({ name, category: "Test", price: 500, quantity: 10 })
        .expect(201);

      expect(created.body.success).toBe(true);
      expect(created.body.data.name).toBe(name);

      await request(app)
        .get("/v1/products")
        .set("Authorization", `Bearer ${employeeLogin.body.data.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.meta).toEqual(
            expect.objectContaining({ page: 1, limit: 20, total: expect.any(Number) })
          );
        });

      await request(app)
        .post("/v1/products")
        .set("Authorization", `Bearer ${employeeLogin.body.data.accessToken}`)
        .send({ name: "Should Fail", category: "Test", price: 100, quantity: 1 })
        .expect(403);

      await request(app)
        .delete(`/v1/products/${created.body.data._id}`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .expect(204);
    });
  });

  describe("customer endpoints", () => {
    it("enforces admin-only customer management", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const employee = trackUser(await createTestUser("employee"));

      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);

      const employeeLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: employee.phone, password: "secret1" })
        .expect(200);

      const customerPhone = phone();
      trackCustomerPhone(customerPhone);

      const created = await request(app)
        .post("/v1/customers")
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({ name: "Endpoint Customer", phone: customerPhone })
        .expect(201);

      expect(created.body.data.phone).toBe(customerPhone);

      await request(app)
        .get("/v1/customers")
        .set("Authorization", `Bearer ${employeeLogin.body.data.accessToken}`)
        .expect(403);

      await request(app)
        .put(`/v1/customers/${created.body.data._id}/debt`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({ amount: 3000, type: "increase" })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.customer.totalDebt).toBe(3000);
          expect(res.body.data.transaction.type).toBe("increase");
        });

      await request(app)
        .delete(`/v1/customers/${created.body.data._id}`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .expect(204);
    });
  });

  describe("supplier endpoints", () => {
    it("enforces admin-only supplier management", async () => {
      const admin = trackUser(await createTestUser("admin"));
      const employee = trackUser(await createTestUser("employee"));

      const adminLogin = await request(app)
        .post("/v1/auth/login")
        .send({ phone: admin.phone, password: "secret1" })
        .expect(200);

      await request(app)
        .post("/v1/auth/login")
        .send({ phone: employee.phone, password: "secret1" })
        .expect(200);

      const supplierPhone = phone();
      trackSupplierPhone(supplierPhone);

      const created = await request(app)
        .post("/v1/suppliers")
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({ name: "Endpoint Supplier", phone: supplierPhone, address: "Somewhere" })
        .expect(201);

      expect(created.body.data.address).toBe("Somewhere");

      await request(app)
        .get("/v1/suppliers")
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .expect(200);

      await request(app)
        .put(`/v1/suppliers/${created.body.data._id}`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({ address: "New Address" })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.address).toBe("New Address");
        });

      await request(app)
        .put(`/v1/suppliers/${created.body.data._id}/debt`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({ amount: 5000, type: "increase" })
        .expect(200);

      await request(app)
        .delete(`/v1/suppliers/${created.body.data._id}`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .expect(409);

      await request(app)
        .put(`/v1/suppliers/${created.body.data._id}/debt`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .send({ amount: 5000, type: "decrease" })
        .expect(200);

      await request(app)
        .delete(`/v1/suppliers/${created.body.data._id}`)
        .set("Authorization", `Bearer ${adminLogin.body.data.accessToken}`)
        .expect(204);
    });
  });
});
