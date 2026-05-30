import { apiClient } from './client';
import { mockSaleApi } from './mocks/sale';
import { saleApi } from './sale';
import useAuthStore from '../stores/authStore';

const USE_MOCK_INVOICES = true;

const realInvoiceApi = {
  getInvoices: (params = {}) => saleApi.getSales(params),
  getInvoiceById: (id) => apiClient(`/invoices/${id}`)
};

const mockedInvoiceApi = {
  getInvoices: (params = {}) => saleApi.getSales(params),
  getInvoiceById: (id) => mockSaleApi.getSaleById(id, useAuthStore.getState().user)
};

export const invoiceApi = USE_MOCK_INVOICES ? mockedInvoiceApi : realInvoiceApi;
