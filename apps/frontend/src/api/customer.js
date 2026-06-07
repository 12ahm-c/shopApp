// src/api/customer.js
import { apiClient } from './client';
import { mockCustomerApi } from './mocks/customer';

const USE_MOCK_CUSTOMERS = import.meta.env.VITE_USE_MOCK_API === 'true';

const realCustomerApi = {
  getCustomers: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.hasDebt) searchParams.append('hasDebt', 'true');
    if (params.search) searchParams.append('search', params.search);
    
    const qs = searchParams.toString();
    return apiClient(`/customers${qs ? `?${qs}` : ''}`);
  },
  getCustomerById: (id) => apiClient(`/customers/${id}`),
  createCustomer: (data) => apiClient('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateDebt: (id, data) => apiClient(`/customers/${id}/debt`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => apiClient(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => apiClient(`/customers/${id}`, { method: 'DELETE' })
};

export const customerApi = USE_MOCK_CUSTOMERS ? mockCustomerApi : realCustomerApi;
