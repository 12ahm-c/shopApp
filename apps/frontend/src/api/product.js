import { apiClient } from './client';
import { mockProductApi } from './mocks/product';

const USE_MOCK_PRODUCTS = import.meta.env.VITE_USE_MOCK_API === 'true';

const createQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page);
  if (params.limit) searchParams.append('limit', params.limit);
  if (params.category) searchParams.append('category', params.category);
  if (params.lowStock) searchParams.append('lowStock', 'true');
  if (params.search) searchParams.append('search', params.search);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const realProductApi = {
  getProducts: (params = {}) => apiClient(`/products${createQueryString(params)}`),
  getProductById: (id) => apiClient(`/products/${id}`),
  createProduct: (data) => apiClient('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateProduct: (id, data) => apiClient(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteProduct: (id) => apiClient(`/products/${id}`, { method: 'DELETE' })
};

export const productApi = USE_MOCK_PRODUCTS ? mockProductApi : realProductApi;
