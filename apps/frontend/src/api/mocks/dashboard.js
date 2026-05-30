import { mockActivityLogApi } from './activityLog';
import { mockCustomerApi } from './customer';
import { mockEmployeeApi } from './employee';
import { mockNotificationApi } from './notification';
import { mockProductApi } from './product';
import { mockSaleApi } from './sale';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createEnvelope = (data) => ({
  success: true,
  data,
  error: null,
  meta: null
});

export const mockDashboardApi = {
  getAdminDashboard: async (currentUser = null) => {
    await delay(350);
    const [sales, products, lowStockProducts, customers, employees, activity] = await Promise.all([
      mockSaleApi.getSales({ page: 1, limit: 10 }, { role: 'admin' }),
      mockProductApi.getProducts({ page: 1, limit: 100 }),
      mockProductApi.getProducts({ page: 1, limit: 10, lowStock: true }),
      mockCustomerApi.getCustomers({ page: 1, limit: 100 }),
      mockEmployeeApi.getEmployees({ page: 1, limit: 100 }),
      mockActivityLogApi.getActivityLogs({ page: 1, limit: 10 }, currentUser)
    ]);

    const todaySales = sales.data.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const outstandingDebt = customers.data.reduce((sum, customer) => sum + customer.totalDebt, 0);

    return createEnvelope({
      stats: {
        todaySales,
        todayOrders: sales.data.length,
        monthlySales: todaySales,
        monthlyOrders: sales.data.length,
        totalProducts: products.meta.total,
        lowStockCount: lowStockProducts.meta.total,
        totalCustomers: customers.meta.total,
        outstandingDebt,
        totalEmployees: employees.meta.total
      },
      recentSales: sales.data,
      lowStockProducts: lowStockProducts.data,
      recentActivity: activity.data
    });
  },

  getEmployeeDashboard: async (currentUser = null) => {
    await delay(350);
    const [sales, notifications] = await Promise.all([
      mockSaleApi.getSales({ page: 1, limit: 10 }, currentUser),
      mockNotificationApi.getNotifications({ page: 1, limit: 1 }, currentUser)
    ]);

    const monthlySales = sales.data.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const monthlyOrders = sales.data.length;

    return createEnvelope({
      stats: {
        todaySales: monthlySales,
        todayOrders: monthlyOrders,
        monthlySales,
        monthlyOrders,
        averageTicket: monthlyOrders ? Math.round(monthlySales / monthlyOrders) : 0
      },
      recentSales: sales.data,
      unreadNotifications: notifications.meta.unreadCount
    });
  }
};
