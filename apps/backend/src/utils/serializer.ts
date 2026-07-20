import type { UserDocument, SaleItem } from "../types";
import type { ProductDocument } from "../modules/product/product.model";
import type { CustomerDocument } from "../modules/customer/customer.model";
import type { SupplierDocument } from "../modules/supplier/supplier.model";
import type { SaleDocument } from "../modules/sale/sale.model";
import type { StoreSettingsDocument } from "../modules/storeSettings/settings.model";
import type { ActivityLogDocument } from "../modules/activityLog/activityLog.model";
import type { NotificationDocument } from "../modules/notification/notification.model";
import type { ExpenseDocument } from "../modules/expense/expense.model";

export const serializeUser = (
  user: UserDocument,
  options: { includeEmployment?: boolean } = {}
) => {
  const dto: Record<string, unknown> = {
    _id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt ? user.lastActiveAt.toISOString() : null
  };

  if (options.includeEmployment || user.role === "employee") {
    dto.salary = user.salary;
    dto.attendance = user.attendance.map((entry) => ({
      date: entry.date.toISOString(),
      status: entry.status
    }));
  }

  return dto;
};

export const serializeProduct = (product: ProductDocument) => ({
  _id: product._id.toString(),
  name: product.name,
  category: product.category,
  price: product.price,
  costPrice: product.costPrice,
  quantity: product.quantity,
  alertThreshold: product.alertThreshold,
  createdAt: product.createdAt.toISOString(),
  updatedAt: product.updatedAt.toISOString()
});

export const serializeCustomer = (customer: CustomerDocument) => ({
  _id: customer._id.toString(),
  name: customer.name,
  phone: customer.phone ?? null,
  totalDebt: customer.totalDebt,
  transactions: customer.transactions.map((t) => ({
    date: t.date.toISOString(),
    amount: t.amount,
    type: t.type,
    note: t.note ?? null,
    newTotalDebt: t.newTotalDebt
  })),
  createdAt: customer.createdAt.toISOString()
});

export const serializeSale = (sale: SaleDocument) => ({
  _id: sale._id.toString(),
  invoiceNumber: sale.invoiceNumber,
  employeeId: sale.employeeId.toString(),
  employeeName: sale.employeeName,
  customerId: sale.customerId?.toString() ?? null,
  customerName: sale.customerName,
  items: sale.items.map((item: SaleItem) => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    costPrice: item.costPrice,
    total: item.total
  })),
  totalAmount: sale.totalAmount,
  paymentMethod: sale.paymentMethod,
  createdAt: sale.createdAt.toISOString()
});

export const serializeSupplier = (supplier: SupplierDocument) => ({
  _id: supplier._id.toString(),
  name: supplier.name,
  phone: supplier.phone ?? null,
  address: supplier.address ?? null,
  totalDebt: supplier.totalDebt,
  transactions: supplier.transactions.map((t) => ({
    date: t.date.toISOString(),
    amount: t.amount,
    type: t.type,
    note: t.note ?? null,
    newTotalDebt: t.newTotalDebt
  })),
  createdAt: supplier.createdAt.toISOString()
});

export const serializeSettings = (settings: StoreSettingsDocument) => ({
  _id: settings._id.toString(),
  storeName: settings.storeName,
  storeAddress: settings.storeAddress,
  storePhone: settings.storePhone,
  logoUrl: settings.logoUrl,
  currency: settings.currency,
  invoiceFooter: settings.invoiceFooter,
  theme: settings.theme,
  language: settings.language
});

export const serializeActivityLog = (log: ActivityLogDocument) => ({
  _id: log._id.toString(),
  userId: log.userId.toString(),
  userName: log.userName,
  action: log.action,
  details: log.details,
  amount: log.amount,
  timestamp: log.timestamp.toISOString()
});

export const serializeExpense = (expense: ExpenseDocument) => ({
  _id: expense._id.toString(),
  description: expense.description,
  category: expense.category,
  amount: expense.amount,
  paidBy: expense.paidBy.toString(),
  paidByName: expense.paidByName,
  note: expense.note ?? null,
  date: expense.date.toISOString(),
  createdAt: expense.createdAt.toISOString(),
  updatedAt: expense.updatedAt.toISOString()
});

export const serializeNotification = (notif: NotificationDocument) => ({
  _id: notif._id.toString(),
  userId: notif.userId.toString(),
  type: notif.type,
  title: notif.title,
  body: notif.body,
  isRead: notif.isRead,
  readAt: notif.readAt ? notif.readAt.toISOString() : null,
  data: notif.data,
  createdAt: notif.createdAt.toISOString()
});
