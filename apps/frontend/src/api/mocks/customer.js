// src/api/mocks/customer.js

let mockCustomerSequence = 3;

const makeObjectId = (sequence) => {
  const suffix = sequence.toString(16).padStart(8, '0');
  const basePrefix = "65f2a1b3c4d5e6f7a8b9c000".slice(0, 24 - suffix.length);
  return `${basePrefix}${suffix}`;
};

const mockError = (code, message) => ({
  success: false,
  data: null,
  error: { code, message, fields: {} },
  meta: null
});

let mockCustomers = [
  {
    _id: "65f2a1b3c4d5e6f7a8b9c0d1",
    name: "Mariam Ould",
    phone: "46543210",
    totalDebt: 12500,
    transactions: [
      {
        date: "2025-06-10T00:00:00.000Z",
        amount: 5000,
        type: "increase",
        note: "Achat téléphone",
        newTotalDebt: 5000
      },
      {
        date: "2025-06-15T00:00:00.000Z",
        amount: 7500,
        type: "increase",
        note: "Achat tablette",
        newTotalDebt: 12500
      }
    ],
    createdAt: "2025-06-01T00:00:00.000Z"
  },
  {
    _id: "65f2a1b3c4d5e6f7a8b9c0d2",
    name: "Sidi Mohamed",
    phone: "44332211",
    totalDebt: 0,
    transactions: [],
    createdAt: "2025-06-05T00:00:00.000Z"
  }
];

export const mockCustomerApi = {
  getCustomers: async (params = {}) => {
    const { search, hasDebt, page = 1, limit = 20 } = params;
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filtered = [...mockCustomers];
    
    if (hasDebt) {
      filtered = filtered.filter(c => c.totalDebt > 0);
    }
    
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        (c.phone && c.phone.includes(query))
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

  getCustomerById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const customer = mockCustomers.find(c => c._id === id);
    if (!customer) {
      return mockError('NOT_FOUND', 'Customer not found');
    }
    return {
      success: true,
      data: {
        customer,
        recentSales: []
      },
      error: null,
      meta: null
    };
  },

  createCustomer: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newCustomer = {
      _id: makeObjectId(mockCustomerSequence++),
      name: data.name,
      phone: data.phone || "",
      totalDebt: data.initialDebt || 0,
      transactions: [],
      createdAt: new Date().toISOString()
    };
    mockCustomers.push(newCustomer);
    return { success: true, data: newCustomer, error: null, meta: null };
  },

  updateDebt: async (id, payload) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const customer = mockCustomers.find(c => c._id === id);
    if (!customer) {
      return mockError('NOT_FOUND', 'Customer not found');
    }

    const { amount, type, note } = payload;
    
    if (type === 'decrease' && amount > customer.totalDebt) {
      return mockError('VALIDATION_ERROR', 'Decrease amount > current debt');
    }

    const newTotalDebt = type === 'increase' ? customer.totalDebt + amount : customer.totalDebt - amount;
    
    const transaction = {
      date: new Date().toISOString(),
      amount,
      type,
      note: note || "",
      newTotalDebt
    };

    customer.totalDebt = newTotalDebt;
    customer.transactions.push(transaction);

    return {
      success: true,
      data: {
        customer,
        transaction
      },
      error: null,
      meta: null
    };
  },

  deleteCustomer: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockCustomers.findIndex(c => c._id === id);
    if (index === -1) {
      return mockError('NOT_FOUND', 'Customer not found');
    }
    mockCustomers.splice(index, 1);
    return { success: true, data: null, error: null, meta: null };
  }
};
