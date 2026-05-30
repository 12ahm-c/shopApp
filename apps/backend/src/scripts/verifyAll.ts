import mongoose from "mongoose";
import { connectDatabase } from "../config/database";

const verifyAll = async (): Promise<void> => {
  await connectDatabase();
  const db = mongoose.connection.db!;

  const collections = ["users", "products", "customers", "suppliers", "sales", "activity_logs", "notifications", "store_settings"];
  const rows: string[] = [];

  for (const name of collections) {
    const count = await db.collection(name).countDocuments({});
    const sample = await db.collection(name).find().limit(1).toArray();
    const fields = sample.length > 0
      ? Object.keys(sample[0]).filter((k) => k !== "_id" && k !== "__v").join(", ")
      : "—";
    rows.push(`  ${name.padEnd(18)} ${String(count).padStart(4)} docs  [${fields}]`);
  }

  console.log(`\nMongoDB Atlas — database: ${mongoose.connection.name}\n`);
  console.log(rows.join("\n"));

  // Verify a sale references real product IDs
  const sale = await db.collection("sales").findOne({}, { sort: { createdAt: -1 } });
  if (sale) {
    const productIds = (sale.items as Array<Record<string, unknown>>).map((i) => i.productId);
    const productsExist = await db.collection("products").countDocuments({ _id: { $in: productIds as any } });
    console.log(`\n  Latest sale #${sale.invoiceNumber}: ${sale.items.length} items, ${sale.totalAmount} MRU, ${productsExist}/${productIds.length} products verified`);
  }

  const totalDocs = (await Promise.all(collections.map((c) => db.collection(c).countDocuments({})))).reduce((a, b) => a + b, 0);
  console.log(`\n  Total documents across all collections: ${totalDocs}\n`);

  await mongoose.disconnect();
};

verifyAll().catch((error) => {
  console.error("Verification failed:", error.message);
  process.exit(1);
});
