let mockExpenseSequence = 1;

const makeObjectId = (sequence) => {
  const suffix = sequence.toString(16).padStart(8, '0');
  const basePrefix = "65e2a1b3c4d5e6f7a8b9e000".slice(0, 24 - suffix.length);
  return `${basePrefix}${suffix}`;
};

const mockError = (code, message) => ({
  success: false,
  data: null,
  error: { code, message, fields: {} },
  meta: null
});

let mockExpenses = [
  {
    _id: "65e2a1b3c4d5e6f7a8b9e001",
    title: "Loyer Boutique",
    amount: 15000,
    category: "rent",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    note: "Loyer mois de juin",
    createdBy: "60d5ecb8b392d20000000001",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    _id: "65e2a1b3c4d5e6f7a8b9e002",
    title: "Electricite",
    amount: 2500,
    category: "utility",
    date: new Date(Date.now() - 86400000).toISOString(),
    note: "Facture SOMELEC",
    createdBy: "60d5ecb8b392d20000000001",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const mockExpenseApi = {
  getExpenses: async (params = {}) => {
    const { page = 1, limit = 20, from, to, category } = params;
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filtered = [...mockExpenses];
    
    if (from) {
      filtered = filtered.filter(e => new Date(e.date) >= new Date(from));
    }
    if (to) {
      filtered = filtered.filter(e => new Date(e.date) <= new Date(to));
    }
    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);
    
    return {
      success: true,
      data: paginated,
      error: null,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: filtered.length
      }
    };
  },

  createExpense: async (data, currentUser) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newExpense = {
      _id: makeObjectId(mockExpenseSequence++),
      ...data,
      date: data.date || new Date().toISOString(),
      note: data.note || "",
      createdBy: currentUser?._id || "60d5ecb8b392d20000000001",
      createdAt: new Date().toISOString()
    };
    mockExpenses.unshift(newExpense);
    return { success: true, data: newExpense, error: null, meta: null };
  },

  updateExpense: async (id, payload) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockExpenses.findIndex(e => e._id === id);
    if (index === -1) {
      return mockError('NOT_FOUND', 'Expense not found');
    }
    
    mockExpenses[index] = { ...mockExpenses[index], ...payload };
    return { success: true, data: mockExpenses[index], error: null, meta: null };
  },

  deleteExpense: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockExpenses.findIndex(e => e._id === id);
    if (index === -1) {
      return mockError('NOT_FOUND', 'Expense not found');
    }
    mockExpenses.splice(index, 1);
    return { success: true, data: null, error: null, meta: null };
  }
};
