import { apiClient } from './client';
import { mockSaleApi } from './mocks/sale';
import useAuthStore from '../stores/authStore';

const USE_MOCK_SALES = import.meta.env.VITE_USE_MOCK_API === 'true';

const createQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page);
  if (params.limit) searchParams.append('limit', params.limit);
  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.employeeId) searchParams.append('employeeId', params.employeeId);
  if (params.customerId) searchParams.append('customerId', params.customerId);
  if (params.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const realSaleApi = {
  createSale: (data) => apiClient('/sales', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getSales: (params = {}) => apiClient(`/sales${createQueryString(params)}`),
  deleteSale: (id) => apiClient(`/sales/${id}`, { method: 'DELETE' })
};

const mockedSaleApi = {
  createSale: (data) => mockSaleApi.createSale(data, useAuthStore.getState().user),
  getSales: (params = {}) => mockSaleApi.getSales(params, useAuthStore.getState().user),
  deleteSale: (id) => mockSaleApi.deleteSale(id)
};

export const saleApi = USE_MOCK_SALES ? mockedSaleApi : realSaleApi;
