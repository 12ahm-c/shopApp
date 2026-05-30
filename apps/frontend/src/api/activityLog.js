import { apiClient } from './client';
import { mockActivityLogApi } from './mocks/activityLog';
import useAuthStore from '../stores/authStore';

const USE_MOCK_ACTIVITY_LOGS = import.meta.env.VITE_USE_MOCK_API === 'true';

const createQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page);
  if (params.limit) searchParams.append('limit', params.limit);
  if (params.from) searchParams.append('from', params.from);
  if (params.to) searchParams.append('to', params.to);
  if (params.action) searchParams.append('action', params.action);
  if (params.userId) searchParams.append('userId', params.userId);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const realActivityLogApi = {
  getActivityLogs: (params = {}) => apiClient(`/activity-logs${createQueryString(params)}`)
};

const mockedActivityLogApi = {
  getActivityLogs: (params = {}) => {
    const currentUser = useAuthStore.getState().user;
    return mockActivityLogApi.getActivityLogs(params, currentUser);
  }
};

export const activityLogApi = USE_MOCK_ACTIVITY_LOGS ? mockedActivityLogApi : realActivityLogApi;
