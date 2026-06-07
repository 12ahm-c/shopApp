import { apiClient } from './client';
import { mockExpenseApi } from './mocks/expense';
import useAuthStore from '../stores/authStore';

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

const createQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page);
  if (params.limit) searchParams.append('limit', params.limit);
  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.category) searchParams.append('category', params.category);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const realExpenseApi = {
  getExpenses: (params = {}) => apiClient(`/expenses${createQueryString(params)}`),
  createExpense: (data) => apiClient('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => apiClient(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) => apiClient(`/expenses/${id}`, { method: 'DELETE' })
};

const mockedExpenseApi = {
  getExpenses: (params) => mockExpenseApi.getExpenses(params),
  createExpense: (data) => {
    const currentUser = useAuthStore.getState().user;
    return mockExpenseApi.createExpense(data, currentUser);
  },
  updateExpense: (id, data) => mockExpenseApi.updateExpense(id, data),
  deleteExpense: (id) => mockExpenseApi.deleteExpense(id)
};

export const expenseApi = USE_MOCK_API ? mockedExpenseApi : realExpenseApi;
