import { Types } from "mongoose";
import mongoose from "mongoose";
import { Sale } from "../sale/sale.model";
import { Product } from "../product/product.model";
import { Customer } from "../customer/customer.model";
import { User } from "../user/user.model";
import { Notification } from "../notification/notification.model";
import { Expense } from "../expense/expense.model";
import { serializeSale } from "../../utils/serializer";

const startOfDay = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (): Date => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const dashboardService = {
  async getAdminDashboard() {
    const todayStart = startOfDay();
    const monthStart = startOfMonth();

    const [
      todaySales,
      monthlySales,
      productStats,
      customerStats,
      employeeCount,
      recentSales,
      lowStockProducts,
      recentActivity,
      monthlyExpenses,
      monthlyCOGS,
      paymentMethodStats
    ] = await Promise.all([
      Sale.aggregate([
        { $match: { createdAt: { $gte: todayStart }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: monthStart }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
      ]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            lowStockCount: { $sum: { $cond: [{ $lte: ["$quantity", "$alertThreshold"] }, 1, 0] } }
          }
        }
      ]),
      Customer.aggregate([
        { $group: { _id: null, totalCustomers: { $sum: 1 }, outstandingDebt: { $sum: "$totalDebt" } } }
      ]),
      User.countDocuments({ role: "employee" }),
      Sale.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(10).lean(),
      Product.find({ $expr: { $lte: ["$quantity", "$alertThreshold"] } }).limit(10).lean(),
      mongoose.connection.collection("activity_logs")
        .find().sort({ timestamp: -1 }).limit(10).toArray(),
      Expense.aggregate([
        { $match: { date: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: monthStart }, isDeleted: false } },
        { $unwind: "$items" },
        { $group: { _id: null, total: { $sum: { $multiply: ["$items.quantity", "$items.costPrice"] } } } }
      ]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: monthStart }, isDeleted: false } },
        { $group: { _id: "$paymentMethod", count: { $sum: 1 }, total: { $sum: "$totalAmount" } } }
      ])
    ]);

    const today = todaySales[0] ?? { total: 0, count: 0 };
    const monthly = monthlySales[0] ?? { total: 0, count: 0 };
    const products = productStats[0] ?? { totalProducts: 0, lowStockCount: 0 };
    const customers = customerStats[0] ?? { totalCustomers: 0, outstandingDebt: 0 };
    const expenses = monthlyExpenses[0] ?? { total: 0 };
    const cogs = monthlyCOGS[0] ?? { total: 0 };

    return {
      stats: {
        todaySales: today.total,
        todayOrders: today.count,
        monthlySales: monthly.total,
        monthlyOrders: monthly.count,
        totalProducts: products.totalProducts,
        lowStockCount: products.lowStockCount,
        totalCustomers: customers.totalCustomers,
        outstandingDebt: customers.outstandingDebt,
        totalEmployees: employeeCount,
        totalExpenses: expenses.total,
        totalCOGS: cogs.total,
        netProfit: monthly.total - cogs.total - expenses.total
      },
      recentSales: (recentSales as any[]).map((s) => serializeSale(s as any)),
      lowStockProducts: lowStockProducts.map((p: any) => ({
        _id: p._id.toString(),
        name: p.name,
        category: p.category,
        price: p.price,
        costPrice: p.costPrice,
        quantity: p.quantity,
        alertThreshold: p.alertThreshold,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      })),
      recentActivity: recentActivity.map((l: any) => ({
        _id: l._id.toString(),
        userId: l.userId.toString(),
        userName: l.userName,
        action: l.action,
        details: l.details,
        amount: l.amount,
        timestamp: l.timestamp.toISOString()
      })),
      paymentMethodStats: paymentMethodStats.map((s: any) => ({
        method: s._id,
        count: s.count,
        total: s.total
      }))
    };
  },

  async getEmployeeDashboard(userId: string) {
    const todayStart = startOfDay();
    const monthStart = startOfMonth();
    const userObjectId = new Types.ObjectId(userId);

    const [todaySales, monthlySales, recentSales, unreadCount] = await Promise.all([
      Sale.aggregate([
        { $match: { employeeId: userObjectId, createdAt: { $gte: todayStart }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { employeeId: userObjectId, createdAt: { $gte: monthStart }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
      ]),
      Sale.find({ employeeId: userObjectId, isDeleted: false })
        .sort({ createdAt: -1 }).limit(10).lean(),
      Notification.countDocuments({ userId: userObjectId, isRead: false })
    ]);

    const today = todaySales[0] ?? { total: 0, count: 0 };
    const monthly = monthlySales[0] ?? { total: 0, count: 0 };
    const averageTicket = monthly.count > 0 ? Math.round(monthly.total / monthly.count) : 0;

    return {
      stats: {
        todaySales: today.total,
        todayOrders: today.count,
        monthlySales: monthly.total,
        monthlyOrders: monthly.count,
        averageTicket
      },
      recentSales: (recentSales as any[]).map((s) => serializeSale(s as any)),
      unreadNotifications: unreadCount
    };
  }
};
