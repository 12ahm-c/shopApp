import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { User } from "../modules/user/user.model";
import { hashPassword } from "../utils/password.util";

const seedUsers = [
  {
    name: "Ahmed Sidi",
    phone: "+22236123456",
    password: "AdminPass123!",
    role: "admin" as const,
    salary: 0,
    attendance: []
  },
  {
    name: "Mohamed Salem",
    phone: "+22236123457",
    password: "EmployeePass123!",
    role: "employee" as const,
    salary: 18000,
    attendance: [
      { date: new Date("2026-05-28T00:00:00.000Z"), status: "present" as const },
      { date: new Date("2026-05-29T00:00:00.000Z"), status: "present" as const },
      { date: new Date("2026-05-30T00:00:00.000Z"), status: "absent" as const }
    ]
  },
  {
    name: "Mariam Mint Ely",
    phone: "+22236123458",
    password: "EmployeePass456!",
    role: "employee" as const,
    salary: 16500,
    attendance: [
      { date: new Date("2026-05-28T00:00:00.000Z"), status: "present" as const },
      { date: new Date("2026-05-29T00:00:00.000Z"), status: "absent" as const },
      { date: new Date("2026-05-30T00:00:00.000Z"), status: "present" as const }
    ]
  }
];

const seedAtlas = async (): Promise<void> => {
  await connectDatabase();

  for (const user of seedUsers) {
    await User.updateOne(
      { phone: user.phone },
      {
        $set: {
          name: user.name,
          passwordHash: await hashPassword(user.password),
          role: user.role,
          salary: user.salary,
          attendance: user.attendance,
          refreshTokens: [],
          lastActiveAt: null
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, runValidators: true }
    );
  }

  await User.syncIndexes();

  const users = await User.find({ phone: { $in: seedUsers.map((user) => user.phone) } })
    .select("name phone role salary attendance")
    .sort({ role: 1, phone: 1 })
    .lean();

  console.log(
    JSON.stringify({
      success: true,
      database: mongoose.connection.name,
      seededCollections: {
        users: users.map((user) => ({
          id: user._id.toString(),
          name: user.name,
          phone: user.phone,
          role: user.role,
          salary: user.salary,
          attendanceEntries: user.attendance.length
        }))
      }
    })
  );
};

seedAtlas()
  .catch((error) => {
    console.error(JSON.stringify({ success: false, message: error.message }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
