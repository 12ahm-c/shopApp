import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/database";
import { StoreSettings } from "../src/modules/storeSettings/settings.model";
import { User } from "../src/modules/user/user.model";
import { hashPassword } from "../src/utils/password.util";

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

describeWithDb("Phase 5 — Store Settings", () => {
  const app = createApp();
  const createdPhones = new Set<string>();

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-access-secret";
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret";
    await connectDatabase();
  }, 30000);

  afterEach(async () => {
    await StoreSettings.deleteMany({});
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

  const login = async (user: { phone: string }) => {
    const res = await request(app)
      .post("/v1/auth/login")
      .send({ phone: user.phone, password: "secret1" })
      .expect(200);
    return res.body.data.accessToken;
  };

  it("GET /settings returns default settings", async () => {
    const admin = trackUser(await createTestUser("admin"));
    const token = await login(admin);

    const res = await request(app)
      .get("/v1/settings")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.storeName).toBe("ShopManager Store");
    expect(res.body.data.currency).toBe("MRU");
  });

  it("PUT /settings updates settings", async () => {
    const admin = trackUser(await createTestUser("admin"));
    const token = await login(admin);

    const res = await request(app)
      .put("/v1/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ storeName: "New Store", theme: "dark", language: "ar" })
      .expect(200);

    expect(res.body.data.storeName).toBe("New Store");
    expect(res.body.data.theme).toBe("dark");
    expect(res.body.data.language).toBe("ar");
  });

  it("employee cannot update settings", async () => {
    const emp = trackUser(await createTestUser("employee"));
    const token = await login(emp);

    await request(app)
      .put("/v1/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ storeName: "Hack" })
      .expect(403);
  });

  it("rejects unauthenticated requests", async () => {
    await request(app).get("/v1/settings").expect(401);
    await request(app).put("/v1/settings").send({}).expect(401);
  });
});
