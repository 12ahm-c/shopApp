let mockExpenseSequence = 2;

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

let mockExpenses = [
  {
    _id: "65f2a1b3c4d5e6f7a8b9c0d1",
    description: "Achat de fournitures de bureau",
    category: "supplies",
    amount: 15000,
    paidBy: "65f2a1b3c4d5e6f7a8b9c0a1",
    paidByName: "Admin",
    note: "Fournitures pour le mois",
    date: "2025-06-10T00:00:00.000Z",
    createdAt: "2025-06-10T00:00:00.000Z",
    updatedAt: "2025-06-10T00:00:00.000Z"
  },
  {
    _id: "65f2a1b3c4d5e6f7a8b9c0d2",
    description: "Facture d'électricité",
    category: "utilities",
    amount: 8500,
    paidBy: "65f2a1b3c4d5e6f7a8b9c0a1",
    paidByName: "Admin",
    note: null,
    date: "2025-06-05T00:00:00.000Z",
    createdAt: "2025-06-05T00:00:00.000Z",
    updatedAt: "2025-06-05T00:00:00.000Z"
  }
];

export const mockExpenseApi = {
  getExpenses: async (params = {}) => {
    const { search, category, from, to, page = 1, limit = 20 } = params;
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = [...mockExpenses];

    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }

    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.description.toLowerCase().includes(query) ||
        e.paidByName.toLowerCase().includes(query)
      );
    }

    if (from) {
      const fromDate = new Date(from);
      filtered = filtered.filter(e => new Date(e.date) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      filtered = filtered.filter(e => new Date(e.date) <= toDate);
    }

    return {
      success: true,
      data: filtered,
      error: null,
      meta: { page, limit, total: filtered.length }
    };
  },

  getExpenseById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const expense = mockExpenses.find(e => e._id === id);
    if (!expense) {
      return mockError('NOT_FOUND', 'Expense not found');
    }
    return { success: true, data: expense, error: null, meta: null };
  },

  createExpense: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newExpense = {
      _id: makeObjectId(mockExpenseSequence++),
      description: data.description,
      category: data.category,
      amount: data.amount,
      paidBy: "65f2a1b3c4d5e6f7a8b9c0a1",
      paidByName: "Admin",
      note: data.note || null,
      date: data.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockExpenses.push(newExpense);
    return { success: true, data: newExpense, error: null, meta: null };
  },

  updateExpense: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const expense = mockExpenses.find(e => e._id === id);
    if (!expense) {
      return mockError('NOT_FOUND', 'Expense not found');
    }
    if (data.description) expense.description = data.description;
    if (data.category) expense.category = data.category;
    if (data.amount) expense.amount = data.amount;
    if (data.note !== undefined) expense.note = data.note;
    if (data.date) expense.date = data.date;
    expense.updatedAt = new Date().toISOString();
    return { success: true, data: expense, error: null, meta: null };
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
