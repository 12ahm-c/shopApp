import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}

const DATABASE_COUNT = 10;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "employee"], required: true },
    salary: { type: Number, default: 0, min: 0 },
    attendance: {
      type: [
        new mongoose.Schema(
          {
            date: { type: Date, required: true },
            status: { type: String, enum: ["present", "absent"], required: true }
          },
          { _id: false }
        )
      ],
      default: []
    },
    refreshTokens: {
      type: [
        new mongoose.Schema(
          {
            tokenHash: { type: String, required: true },
            jti: { type: String, required: true },
            expiresAt: { type: Date, required: true },
            revokedAt: { type: Date },
            createdAt: { type: Date, default: Date.now, required: true }
          },
          { _id: false }
        )
      ],
      default: [],
      select: false
    },
    fcmTokens: { type: [String], default: [] },
    lastActiveAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });

function getDbUri(dbName: string): string {
  const url = new URL(MONGODB_URI!);
  url.pathname = `/${dbName}`;
  return url.toString();
}

async function createDatabase(dbName: string): Promise<void> {
  const uri = getDbUri(dbName);
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db!;
  const collections = await db.listCollections({ name: "users" }).toArray();

  if (collections.length === 0) {
    await db.createCollection("users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "phone", "passwordHash", "role"],
          properties: {
            name: { bsonType: "string", minLength: 2, maxLength: 100 },
            phone: { bsonType: "string" },
            passwordHash: { bsonType: "string" },
            role: { bsonType: "string", enum: ["admin", "employee"] },
            salary: { bsonType: "number", minimum: 0 },
            attendance: {
              bsonType: "array",
              items: {
                bsonType: "object",
                required: ["date", "status"],
                properties: {
                  date: { bsonType: "date" },
                  status: { bsonType: "string", enum: ["present", "absent"] }
                }
              }
            },
            refreshTokens: {
              bsonType: "array",
              items: {
                bsonType: "object",
                required: ["tokenHash", "jti", "expiresAt", "createdAt"],
                properties: {
                  tokenHash: { bsonType: "string" },
                  jti: { bsonType: "string" },
                  expiresAt: { bsonType: "date" },
                  revokedAt: { bsonType: "date" },
                  createdAt: { bsonType: "date" }
                }
              }
            },
            fcmTokens: { bsonType: "array", items: { bsonType: "string" } },
            lastActiveAt: { bsonType: "date" }
          }
        }
      }
    });

    const usersCollection = db.collection("users");
    await usersCollection.createIndex({ phone: 1 }, { unique: true });
    await usersCollection.createIndex({ role: 1 });

    console.log(`✅ ${dbName}: users collection created with indexes`);
  } else {
    console.log(`⏭️  ${dbName}: users collection already exists, skipping`);
  }

  await conn.close();
}

async function main(): Promise<void> {
  console.log(`Creating ${DATABASE_COUNT} restaurant databases...\n`);

  for (let i = 1; i <= DATABASE_COUNT; i++) {
    const dbName = `restaurants_${i}`;
    await createDatabase(dbName);
  }

  console.log("\n🎉 All done!");
}

main()
  .catch((error) => {
    console.error("❌ Failed:", error.message);
    process.exitCode = 1;
  });
