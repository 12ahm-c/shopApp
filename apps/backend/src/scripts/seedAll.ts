import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { User } from "../modules/user/user.model";
import { Product } from "../modules/product/product.model";
import { Customer } from "../modules/customer/customer.model";
import { Supplier } from "../modules/supplier/supplier.model";
import { hashPassword } from "../utils/password.util";

const seedAll = async (): Promise<void> => {
  await connectDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  console.log(`Connected to Atlas database: ${mongoose.connection.name}`);

  // ─── COLLECTIONS TO CLEAR ─────────────────────────────────────────
  const collections = ["users", "products", "customers", "suppliers", "sales", "activity_logs", "notifications", "store_settings"];
  for (const name of collections) {
    await db.collection(name).deleteMany({});
    console.log(`  Cleared collection: ${name}`);
  }

  // ─── USERS ────────────────────────────────────────────────────────
  const usersData = [
    { name: "Ahmed Sidi", phone: "+22236123456", password: "AdminPass123!", role: "admin" as const, salary: 0 },
    { name: "Mohamed Salem", phone: "+22236123457", password: "EmployeePass123!", role: "employee" as const, salary: 18000 },
    { name: "Mariam Mint Ely", phone: "+22236123458", password: "EmployeePass456!", role: "employee" as const, salary: 16500 },
    { name: "Sidi Ould Cheikh", phone: "+22236123459", password: "Cashier789!", role: "employee" as const, salary: 15000 },
    { name: "Fatimatou Mint Sidi", phone: "+22236123460", password: "Cashier012!", role: "employee" as const, salary: 17000 }
  ];

  const users: Array<{ _id: mongoose.Types.ObjectId; role: string; phone: string; name: string }> = [];
  for (const u of usersData) {
    const user = await User.create({
      name: u.name,
      phone: u.phone,
      passwordHash: await hashPassword(u.password),
      role: u.role,
      salary: u.salary,
      attendance: u.role === "employee"
        ? [
            { date: new Date("2026-05-28T00:00:00.000Z"), status: "present" },
            { date: new Date("2026-05-29T00:00:00.000Z"), status: Math.random() > 0.5 ? "present" : "absent" },
            { date: new Date("2026-05-30T00:00:00.000Z"), status: Math.random() > 0.5 ? "present" : "absent" }
          ]
        : [],
      refreshTokens: []
    });
    users.push({ _id: user._id as mongoose.Types.ObjectId, role: u.role, phone: u.phone, name: u.name });
  }
  console.log(`  Inserted ${users.length} users`);

  // ─── PRODUCTS ─────────────────────────────────────────────────────
  const productsData = [
    { name: "Café Torréfaction Maison 250g", category: "Épicerie", price: 450, quantity: 23, alertThreshold: 5 },
    { name: "Sucre 1kg", category: "Épicerie", price: 80, quantity: 2, alertThreshold: 10 },
    { name: "Huile Végétale 1L", category: "Épicerie", price: 320, quantity: 15, alertThreshold: 5 },
    { name: "Farine de Blé 1kg", category: "Épicerie", price: 120, quantity: 8, alertThreshold: 5 },
    { name: "Riz Long Grain 5kg", category: "Épicerie", price: 550, quantity: 1, alertThreshold: 3 },
    { name: "Lait Concentré Sucré", category: "Produits Laitiers", price: 95, quantity: 40, alertThreshold: 10 },
    { name: "Fromage Fondu 200g", category: "Produits Laitiers", price: 180, quantity: 12, alertThreshold: 5 },
    { name: "Yaourt Nature 1L", category: "Produits Laitiers", price: 150, quantity: 0, alertThreshold: 5 },
    { name: "Eau Minérale 1.5L", category: "Boissons", price: 60, quantity: 48, alertThreshold: 12 },
    { name: "Jus d'Orange 1L", category: "Boissons", price: 200, quantity: 7, alertThreshold: 5 },
    { name: "Boisson Gazeuse 33cl", category: "Boissons", price: 80, quantity: 3, alertThreshold: 10 },
    { name: "Thé Vert 100g", category: "Épicerie", price: 250, quantity: 20, alertThreshold: 5 },
    { name: "Savon Liquide 500ml", category: "Hygiène", price: 180, quantity: 14, alertThreshold: 5 },
    { name: "Dentifrice 75ml", category: "Hygiène", price: 120, quantity: 25, alertThreshold: 5 },
    { name: "Shampooing 200ml", category: "Hygiène", price: 250, quantity: 9, alertThreshold: 5 },
    { name: "Légumes Surgelés 1kg", category: "Surgelés", price: 350, quantity: 18, alertThreshold: 5 },
    { name: "Poisson Surgelé 500g", category: "Surgelés", price: 420, quantity: 4, alertThreshold: 5 },
    { name: "Poulet Surgelé 1kg", category: "Surgelés", price: 680, quantity: 11, alertThreshold: 5 },
    { name: "Biscuits Sucrés 200g", category: "Épicerie", price: 130, quantity: 30, alertThreshold: 10 },
    { name: "Pâtes Alimentaires 500g", category: "Épicerie", price: 90, quantity: 6, alertThreshold: 5 }
  ];

  const products = await Product.insertMany(productsData);
  console.log(`  Inserted ${products.length} products`);

  // ─── CUSTOMERS ────────────────────────────────────────────────────
  const customersData = [
    { name: "Mariam Ould", phone: "+22246543210", initialDebt: 12500 },
    { name: "Brahim Ould Mohamed", phone: "+22246543211", initialDebt: 0 },
    { name: "Aisha Mint Ahmed", phone: "+22246543212", initialDebt: 5000 },
    { name: "Salem Ould Ali", phone: "+22246543213", initialDebt: 0 },
    { name: "Zeinebou Mint Moktar", phone: "+22246543214", initialDebt: 8500 },
    { name: "Mohamed Mahmoud Ould", phone: "+22246543215", initialDebt: 0 },
    { name: "Khadijetou Mint Sidi", phone: "+22246543216", initialDebt: 3200 },
    { name: "Sid'Ahmed Ould Taleb", phone: "+22246543217", initialDebt: 15000 },
    { name: "Mouna Mint Beibacar", phone: "+22246543218", initialDebt: 0 }
  ];

  const customers: Array<{ _id: mongoose.Types.ObjectId; name: string; totalDebt: number }> = [];
  for (const c of customersData) {
    const doc: Record<string, unknown> = { name: c.name };
    if (c.phone) doc.phone = c.phone;
    const transactions: Array<Record<string, unknown>> = [];
    if (c.initialDebt > 0) {
      doc.totalDebt = c.initialDebt;
      transactions.push({
        date: new Date("2026-05-15T10:00:00.000Z"),
        amount: c.initialDebt,
        type: "increase",
        note: "Initial debt",
        newTotalDebt: c.initialDebt
      });
    }
    doc.transactions = transactions;
    const customer = await Customer.create(doc);
    customers.push({ _id: customer._id as mongoose.Types.ObjectId, name: c.name, totalDebt: c.initialDebt });
  }
  console.log(`  Inserted ${customers.length} customers`);

  // ─── SUPPLIERS ────────────────────────────────────────────────────
  const suppliersData = [
    { name: "Distributions Sahéliennes", phone: "+22247654321", address: "Nouakchott, Tevragh Zeina", initialDebt: 12500 },
    { name: "Société Mauritanienne d'Alimentation", phone: "+22247654322", address: "Nouakchott, Ksar", initialDebt: 0 },
    { name: "Frais & Surgelés Import", phone: "+22247654323", address: "Nouadhibou, Centre", initialDebt: 8000 },
    { name: "Hygiène Pro Mauritanie", phone: "+22247654324", address: "Nouakchott, Dar Naim", initialDebt: 0 },
    { name: "Boissons & Distribution", phone: "+22247654325", address: "Nouakchott, Sebkha", initialDebt: 5000 }
  ];

  const suppliers: Array<{ _id: mongoose.Types.ObjectId; name: string; totalDebt: number }> = [];
  for (const s of suppliersData) {
    const doc: Record<string, unknown> = { name: s.name, address: s.address ?? "" };
    if (s.phone) doc.phone = s.phone;
    const transactions: Array<Record<string, unknown>> = [];
    if (s.initialDebt > 0) {
      doc.totalDebt = s.initialDebt;
      transactions.push({
        date: new Date("2026-05-18T10:00:00.000Z"),
        amount: s.initialDebt,
        type: "increase",
        note: "Initial debt",
        newTotalDebt: s.initialDebt
      });
    }
    doc.transactions = transactions;
    const supplier = await Supplier.create(doc);
    suppliers.push({ _id: supplier._id as mongoose.Types.ObjectId, name: s.name, totalDebt: s.initialDebt });
  }
  console.log(`  Inserted ${suppliers.length} suppliers`);

  // ─── SALES ────────────────────────────────────────────────────────
  const paymentMethods = ["cash", "card", "bankily"] as const;
  const salesCollection = db.collection("sales");
  const activityCollection = db.collection("activity_logs");
  const notificationCollection = db.collection("notifications");

  // Get employee users (skip admin)
  const employees = users.filter((u) => u.role === "employee");
  // Use all products and customers for variety
  const invoiceCounter = { seq: 1000 };

  const saleDates: Date[] = [];
  const now = new Date("2026-05-30T18:00:00.000Z");
  for (let i = 0; i < 20; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - Math.floor(Math.random() * 28));
    d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    saleDates.push(d);
  }
  saleDates.sort((a, b) => a.getTime() - b.getTime());

  for (const saleDate of saleDates) {
    // Pick 1-4 random items
    const itemCount = 1 + Math.floor(Math.random() * 4);
    const shuffledProducts = [...products].sort(() => Math.random() - 0.5).slice(0, itemCount);
    const items: Array<Record<string, unknown>> = [];
    let totalAmount = 0;

    for (const prod of shuffledProducts) {
      const maxQty = Math.min(prod.quantity === 0 ? 0 : Math.min(prod.quantity, 5), 5);
      if (maxQty === 0) continue;
      const quantity = 1 + Math.floor(Math.random() * maxQty);
      const unitPrice = prod.price + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 50 : -50) : 0);
      const total = quantity * unitPrice;
      totalAmount += total;
      items.push({
        productId: prod._id,
        name: prod.name,
        quantity,
        unitPrice,
        total
      });
    }

    if (items.length === 0) continue;

    const employee = employees[Math.floor(Math.random() * employees.length)];
    const customer = Math.random() > 0.5 ? customers[Math.floor(Math.random() * customers.length)] : null;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    invoiceCounter.seq += 1;

    const sale = {
      invoiceNumber: invoiceCounter.seq,
      employeeId: employee._id,
      employeeName: employee.name,
      customerId: customer ? customer._id : null,
      customerName: customer ? customer.name : "Client du jour",
      items,
      totalAmount,
      paymentMethod,
      createdAt: saleDate
    };

    const saleResult = await salesCollection.insertOne(sale);
    const saleId = saleResult.insertedId;

    // Activity log for sale
    await activityCollection.insertOne({
      userId: employee._id,
      userName: employee.name,
      action: "sale",
      details: `Vente #${invoiceCounter.seq} - ${totalAmount} MRU`,
      amount: totalAmount,
      timestamp: saleDate
    });
  }
  console.log(`  Inserted ${invoiceCounter.seq - 1000} sales`);

  // ─── ADDITIONAL ACTIVITY LOGS ─────────────────────────────────────
  // Login/logout logs for each employee
  for (const employee of employees) {
    const loginDate = new Date("2026-05-30T08:00:00.000Z");
    const logoutDate = new Date("2026-05-30T17:30:00.000Z");

    await activityCollection.insertOne({
      userId: employee._id,
      userName: employee.name,
      action: "login",
      details: "Connexion - début de service",
      amount: null,
      timestamp: loginDate
    });

    await activityCollection.insertOne({
      userId: employee._id,
      userName: employee.name,
      action: "logout",
      details: "Déconnexion - fin de service",
      amount: null,
      timestamp: logoutDate
    });
  }

  // Admin login
  const admin = users.find((u) => u.role === "admin")!;
  await activityCollection.insertOne({
    userId: admin._id,
    userName: "Ahmed Sidi",
    action: "login",
    details: "Connexion administrateur",
    amount: null,
    timestamp: new Date("2026-05-30T07:45:00.000Z")
  });

  const activityCount = await activityCollection.countDocuments({});
  console.log(`  Inserted ${activityCount} activity logs`);

  // ─── NOTIFICATIONS ────────────────────────────────────────────────
  const lowStockProducts = products.filter((p) => p.quantity <= p.alertThreshold);

  for (const prod of lowStockProducts) {
    await notificationCollection.insertOne({
      userId: admin._id,
      type: "low_stock",
      title: `Stock faible : ${prod.name}`,
      body: `Il reste ${prod.quantity} unités de ${prod.name}. Seuil: ${prod.alertThreshold}.`,
      isRead: Math.random() > 0.5,
      readAt: Math.random() > 0.5 ? new Date() : null,
      data: { productId: prod._id.toString() },
      createdAt: new Date()
    });
  }

  // Debt-related notifications
  const debtCustomers = customers.filter((c) => c.totalDebt > 0);
  for (const cust of debtCustomers) {
    await notificationCollection.insertOne({
      userId: admin._id,
      type: "debt_updated",
      title: `Dette mise à jour : ${cust.name}`,
      body: `${cust.name} a une dette de ${cust.totalDebt} MRU.`,
      isRead: Math.random() > 0.4,
      readAt: Math.random() > 0.4 ? new Date() : null,
      data: { customerId: cust._id.toString() },
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
    });
  }

  const notifCount = await notificationCollection.countDocuments({});
  console.log(`  Inserted ${notifCount} notifications`);

  // ─── STORE SETTINGS ───────────────────────────────────────────────
  await db.collection("store_settings").insertOne({
    storeName: "ShopManager Store",
    storeAddress: "Nouakchott, Mauritanie",
    storePhone: "+22236123456",
    logoUrl: "https://res.cloudinary.com/shopmanager/logo.png",
    currency: "MRU",
    invoiceFooter: "Merci de votre visite !",
    theme: "light",
    language: "fr"
  });
  console.log("  Inserted 1 store_settings document");

  // ─── SYNCHRONIZE INDEXES ──────────────────────────────────────────
  await User.syncIndexes();
  await Product.syncIndexes();
  await Customer.syncIndexes();
  await Supplier.syncIndexes();
  console.log("  Synchronized indexes");

  // ─── REPORT ───────────────────────────────────────────────────────
  const report: Record<string, number> = {};
  for (const name of collections) {
    report[name] = await db.collection(name).countDocuments({});
  }

  console.log("\n" + JSON.stringify({
    success: true,
    database: mongoose.connection.name,
    atlas: mongoose.connection.host,
    collections: report
  }, null, 2));
};

seedAll()
  .catch((error) => {
    console.error(JSON.stringify({ success: false, message: error.message }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("Disconnected from Atlas");
  });
