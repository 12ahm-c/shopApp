const mockPurchases = [
  {
    _id: '6650a1b2c3d4e5f6a7b8c9d0',
    purchaseNumber: 'P001',
    supplierId: '6650a1b2c3d4e5f6a7b8c9d5',
    supplierName: ' Mohammed Suppliers',
    items: [
      { productId: '6650a1b2c3d4e5f6a7b8c9e0', name: 'لابتوب HP', quantity: 10, unitPrice: 2000, total: 20000 },
      { productId: '6650a1b2c3d4e5f6a7b8c9e1', name: 'سماعات', quantity: 20, unitPrice: 150, total: 3000 }
    ],
    totalAmount: 23000,
    notes: 'شحنة شهر يوليو',
    createdAt: '2024-07-24T10:30:00.000Z',
    updatedAt: '2024-07-24T10:30:00.000Z'
  },
  {
    _id: '6650a1b2c3d4e5f6a7b8c9d1',
    purchaseNumber: 'P002',
    supplierId: '6650a1b2c3d4e5f6a7b8c9d6',
    supplierName: 'Ali Traders',
    items: [
      { productId: '6650a1b2c3d4e5f6a7b8c9e2', name: 'شاحن', quantity: 50, unitPrice: 80, total: 4000 }
    ],
    totalAmount: 4000,
    notes: '',
    createdAt: '2024-07-23T14:00:00.000Z',
    updatedAt: '2024-07-23T14:00:00.000Z'
  }
];

let nextId = 3;
let nextNum = 3;

export const mockPurchaseApi = {
  getPurchases: async (params = {}) => {
    await new Promise((r) => setTimeout(r, 300));
    let filtered = [...mockPurchases];

    if (params.supplierId) {
      filtered = filtered.filter((p) => p.supplierId === params.supplierId);
    }
    if (params.from) {
      filtered = filtered.filter((p) => new Date(p.createdAt) >= new Date(params.from));
    }
    if (params.to) {
      filtered = filtered.filter((p) => new Date(p.createdAt) <= new Date(params.to));
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter((p) =>
        p.purchaseNumber.toLowerCase().includes(s) ||
        p.supplierName.toLowerCase().includes(s)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
      data: paged,
      meta: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) }
    };
  },

  getPurchaseById: async (id) => {
    await new Promise((r) => setTimeout(r, 200));
    const purchase = mockPurchases.find((p) => p._id === id);
    if (!purchase) throw new Error('Purchase not found');
    return { data: purchase };
  },

  createPurchase: async (data) => {
    await new Promise((r) => setTimeout(r, 500));
    const purchase = {
      _id: `6650a1b2c3d4e5f6a7b8c9d${nextId++}`,
      purchaseNumber: `P${String(nextNum++).padStart(3, '0')}`,
      supplierId: data.supplierId,
      supplierName: data.supplierName || 'Unknown Supplier',
      items: data.items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice
      })),
      totalAmount: data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockPurchases.unshift(purchase);
    return { data: purchase };
  }
};
