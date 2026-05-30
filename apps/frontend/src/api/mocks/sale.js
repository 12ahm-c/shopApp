// Contract-matching mock data for docs/API-Contract.md sections 5 and 6.
let saleSequence = 3;

const createMockId = () => {
  const suffix = saleSequence.toString(16).padStart(2, '0');
  saleSequence += 1;
  return `65f2a1b3c4d5e6f7a8b9c0${suffix}`;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const productNamesById = {
  "65f2a1b3c4d5e6f7a8b9c0d1": "Cafe Torrefaction Maison 250g",
  "65f2a1b3c4d5e6f7a8b9c0d2": "Sucre 1kg"
};

let mockSales = [
  {
    _id: "65f2a1b3c4d5e6f7a8b9c0d1",
    invoiceNumber: 1042,
    employeeId: "60d5ecb8b392d20000000002",
    employeeName: "Employee User",
    customerId: "65f2a1b3c4d5e6f7a8b9c0d1",
    customerName: "Mariam Ould",
    items: [
      {
        productId: "65f2a1b3c4d5e6f7a8b9c0d1",
        name: "Cafe Torrefaction Maison 250g",
        quantity: 2,
        unitPrice: 450,
        total: 900
      },
      {
        productId: "65f2a1b3c4d5e6f7a8b9c0d2",
        name: "Sucre 1kg",
        quantity: 1,
        unitPrice: 80,
        total: 80
      }
    ],
    totalAmount: 980,
    paymentMethod: "cash",
    createdAt: "2025-06-16T14:32:11.000Z"
  },
  {
    _id: "65f2a1b3c4d5e6f7a8b9c0d2",
    invoiceNumber: 1043,
    employeeId: "60d5ecb8b392d20000000003",
    employeeName: "Cashier User",
    customerId: null,
    customerName: "Client anonyme",
    items: [
      {
        productId: "65f2a1b3c4d5e6f7a8b9c0d1",
        name: "Cafe Torrefaction Maison 250g",
        quantity: 1,
        unitPrice: 430,
        total: 430
      }
    ],
    totalAmount: 430,
    paymentMethod: "bankily",
    createdAt: "2025-06-16T16:05:00.000Z"
  }
];

const createEnvelope = (data, meta = null) => ({
  success: true,
  data,
  error: null,
  meta
});

const createError = (code, message) => ({
  success: false,
  data: null,
  error: { code, message, fields: {} },
  meta: null
});

const applySaleFilters = (sales, params, currentUser) => {
  const roleScopedSales = currentUser?.role === 'employee'
    ? sales.filter((sale) => sale.employeeId === currentUser._id)
    : sales;

  return roleScopedSales.filter((sale) => {
    if (params.employeeId && sale.employeeId !== params.employeeId) return false;
    if (params.customerId && sale.customerId !== params.customerId) return false;
    if (params.from && sale.createdAt < params.from) return false;
    if (params.to && sale.createdAt > params.to) return false;
    return true;
  });
};

export const mockSaleApi = {
  createSale: async (data, currentUser = null) => {
    await delay(800);

    const { items, customerId, customerName, paymentMethod } = data;

    if (!items || items.length === 0) {
      throw createError("VALIDATION_ERROR", "Cart is empty.");
    }

    if (!paymentMethod) {
      throw createError("VALIDATION_ERROR", "Payment method required.");
    }

    const invoiceItems = items.map((item) => ({
      productId: item.productId,
      name: productNamesById[item.productId] || `Produit ${item.productId.slice(-4)}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice
    }));
    const totalAmount = invoiceItems.reduce((sum, item) => sum + item.total, 0);

    const saleRecord = {
      _id: createMockId(),
      invoiceNumber: 1042 + saleSequence,
      employeeId: currentUser?._id || "60d5ecb8b392d20000000002",
      employeeName: currentUser?.name || "Employee User",
      customerId: customerId || null,
      customerName: customerName || "Client anonyme",
      items: invoiceItems,
      totalAmount,
      paymentMethod,
      createdAt: new Date().toISOString()
    };

    mockSales = [saleRecord, ...mockSales];

    return createEnvelope({
      sale: saleRecord,
      stockUpdates: items.map(i => ({
        productId: i.productId,
        oldQuantity: 10,
        newQuantity: Math.max(0, 10 - i.quantity)
      }))
    });
  },

  getSales: async (params = {}, currentUser = null) => {
    await delay(300);
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 20);
    const filteredSales = applySaleFilters(mockSales, params, currentUser);
    const startIndex = (page - 1) * limit;

    return createEnvelope(
      filteredSales.slice(startIndex, startIndex + limit),
      { page, limit, total: filteredSales.length }
    );
  },

  getSaleById: async (id, currentUser = null) => {
    await delay(250);
    const sale = mockSales.find((item) => item._id === id);
    if (!sale) return createError("NOT_FOUND", "Sale does not exist");
    if (currentUser?.role === 'employee' && sale.employeeId !== currentUser._id) {
      return createError("FORBIDDEN", "Role lacks the required permission");
    }
    return createEnvelope(sale);
  },

  deleteSale: async (id) => {
    await delay(400);
    const saleIndex = mockSales.findIndex((item) => item._id === id);
    if (saleIndex === -1) return createError("NOT_FOUND", "Sale does not exist");

    const [deletedSale] = mockSales.splice(saleIndex, 1);
    return createEnvelope({
      restoredStock: deletedSale.items.map((item) => ({
        productId: item.productId,
        oldQuantity: 10,
        newQuantity: 10 + item.quantity
      })),
      deletedSale
    });
  }
};
