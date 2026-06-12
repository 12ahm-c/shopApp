import { apiClient } from './client';
import { mockExpenseApi } from './mocks/expense';

const USE_MOCK_EXPENSES = import.meta.env.VITE_USE_MOCK_API === 'true';

const realExpenseApi = {
  getExpenses: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.category) searchParams.append('category', params.category);
    if (params.from) searchParams.append('from', params.from);
    if (params.to) searchParams.append('to', params.to);
    if (params.search) searchParams.append('search', params.search);

    const qs = searchParams.toString();
    return apiClient(`/expenses${qs ? `?${qs}` : ''}`);
  },
  getExpenseById: (id) => apiClient(`/expenses/${id}`),
  createExpense: (data) => apiClient('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => apiClient(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => apiClient(`/expenses/${id}`, { method: 'DELETE' })
};

export const expenseApi = USE_MOCK_EXPENSES ? mockExpenseApi : realExpenseApi;
