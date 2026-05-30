import { apiClient } from './client';
import { mockEmployeeApi } from './mocks/employee';

const USE_MOCK_EMPLOYEES = import.meta.env.VITE_USE_MOCK_API === 'true';

const createQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page);
  if (params.limit) searchParams.append('limit', params.limit);
  if (params.search) searchParams.append('search', params.search);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const realEmployeeApi = {
  getEmployees: (params = {}) => apiClient(`/employees${createQueryString(params)}`),
  getEmployeeById: (id) => apiClient(`/employees/${id}`),
  createEmployee: (data) => apiClient('/employees', {
    method: 'POST',
    body: JSON.stringify({ ...data, role: 'employee' })
  }),
  updateEmployee: (id, data) => apiClient(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  updateAttendance: (id, data) => apiClient(`/employees/${id}/attendance`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

export const employeeApi = USE_MOCK_EMPLOYEES ? mockEmployeeApi : realEmployeeApi;
