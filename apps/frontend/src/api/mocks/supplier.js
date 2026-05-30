// src/api/mocks/supplier.js

let mockSupplierSequence = 2;

const makeObjectId = (sequence) => {
  const suffix = sequence.toString(16).padStart(8, '0');
  const basePrefix = "65f2a1b3c4d5e6f7a8b9d000".slice(0, 24 - suffix.length);
  return `${basePrefix}${suffix}`;
};

const mockError = (code, message) => ({
  success: false,
  data: null,
  error: { code, message, fields: {} },
  meta: null
});

let mockSuppliers = [
  {
    _id: "65f2a1b3c4d5e6f7a8b9c0d1",
    name: "Distributions Sahéliennes",
    phone: "47654321",
    address: "Nouakchott, Tevragh Zeina",
    totalDebt: 12500,
    transactions: [
      {
        date: "2025-06-10T00:00:00.000Z",
        amount: 5000,
        type: "increase",
        note: "Achat marchandise",
        newTotalDebt: 5000
      }
    ],
    createdAt: "2025-05-20T00:00:00.000Z"
  }
];

export const mockSupplierApi = {
  getSuppliers: async (params = {}) => {
    const { search, hasDebt, page = 1, limit = 20 } = params;
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filtered = [...mockSuppliers];
    
    if (hasDebt) {
      filtered = filtered.filter(s => s.totalDebt > 0);
    }
    
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) || 
        (s.phone && s.phone.includes(query))
      );
    }
    
    return {
      success: true,
      data: filtered,
      error: null,
      meta: {
        page,
        limit,
        total: filtered.length
      }
    };
  },

  getSupplierById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const supplier = mockSuppliers.find(s => s._id === id);
    if (!supplier) {
      return mockError('NOT_FOUND', 'Supplier not found');
    }
    return {
      success: true,
      data: {
        supplier,
        recentPurchases: []
      },
      error: null,
      meta: null
    };
  },

  createSupplier: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newSupplier = {
      _id: makeObjectId(mockSupplierSequence++),
      name: data.name,
      phone: data.phone || "",
      address: data.address || "",
      totalDebt: data.initialDebt || 0,
      transactions: [],
      createdAt: new Date().toISOString()
    };
    mockSuppliers.push(newSupplier);
    return { success: true, data: newSupplier, error: null, meta: null };
  },

  updateSupplier: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const supplier = mockSuppliers.find(s => s._id === id);
    if (!supplier) {
      return mockError('NOT_FOUND', 'Supplier not found');
    }
    if (data.name) supplier.name = data.name;
    if (data.phone) supplier.phone = data.phone;
    if (data.address) supplier.address = data.address;
    return { success: true, data: supplier, error: null, meta: null };
  },

  updateDebt: async (id, payload) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const supplier = mockSuppliers.find(s => s._id === id);
    if (!supplier) {
      return mockError('NOT_FOUND', 'Supplier not found');
    }

    const { amount, type, note } = payload;
    
    if (type === 'decrease' && amount > supplier.totalDebt) {
      return mockError('VALIDATION_ERROR', 'Decrease amount > current debt');
    }

    const newTotalDebt = type === 'increase' ? supplier.totalDebt + amount : supplier.totalDebt - amount;
    
    const transaction = {
      date: new Date().toISOString(),
      amount,
      type,
      note: note || "",
      newTotalDebt
    };

    supplier.totalDebt = newTotalDebt;
    supplier.transactions.push(transaction);

    return {
      success: true,
      data: {
        supplier,
        transaction
      },
      error: null,
      meta: null
    };
  },

  deleteSupplier: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockSuppliers.findIndex(s => s._id === id);
    if (index === -1) {
      return mockError('NOT_FOUND', 'Supplier not found');
    }
    mockSuppliers.splice(index, 1);
    return { success: true, data: null, error: null, meta: null };
  }
};
