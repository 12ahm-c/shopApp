// src/api/supplier.js
import { apiClient } from './client';
import { mockSupplierApi } from './mocks/supplier';

const USE_MOCK_SUPPLIERS = true;

const realSupplierApi = {
  getSuppliers: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.hasDebt) searchParams.append('hasDebt', 'true');
    if (params.search) searchParams.append('search', params.search);
    
    const qs = searchParams.toString();
    return apiClient(`/suppliers${qs ? `?${qs}` : ''}`);
  },
  getSupplierById: (id) => apiClient(`/suppliers/${id}`),
  createSupplier: (data) => apiClient('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => apiClient(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateDebt: (id, data) => apiClient(`/suppliers/${id}/debt`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => apiClient(`/suppliers/${id}`, { method: 'DELETE' })
};

export const supplierApi = USE_MOCK_SUPPLIERS ? mockSupplierApi : realSupplierApi;
