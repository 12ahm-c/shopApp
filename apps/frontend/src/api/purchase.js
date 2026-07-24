import { apiClient } from './client';
import { mockPurchaseApi } from './mocks/purchase';

const USE_MOCK_PURCHASE = import.meta.env.VITE_USE_MOCK_API === 'true';

const createQueryString = (params) => {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
};

const realPurchaseApi = {
  getPurchases: (params) => apiClient(`/purchases${createQueryString(params)}`),
  getPurchaseById: (id) => apiClient(`/purchases/${id}`),
  createPurchase: (data) => apiClient('/purchases', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const purchaseApi = USE_MOCK_PURCHASE ? mockPurchaseApi : realPurchaseApi;
