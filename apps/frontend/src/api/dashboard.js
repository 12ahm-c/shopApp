import { apiClient } from './client';
import { mockDashboardApi } from './mocks/dashboard';
import useAuthStore from '../stores/authStore';

const USE_MOCK_DASHBOARD = import.meta.env.VITE_USE_MOCK_API === 'true';

const realDashboardApi = {
  getAdminDashboard: () => apiClient('/dashboard/admin'),
  getEmployeeDashboard: () => apiClient('/dashboard/employee')
};

const mockedDashboardApi = {
  getAdminDashboard: () => mockDashboardApi.getAdminDashboard(useAuthStore.getState().user),
  getEmployeeDashboard: () => mockDashboardApi.getEmployeeDashboard(useAuthStore.getState().user)
};

export const dashboardApi = USE_MOCK_DASHBOARD ? mockedDashboardApi : realDashboardApi;
