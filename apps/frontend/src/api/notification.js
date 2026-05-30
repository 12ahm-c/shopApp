import { apiClient } from './client';
import { mockNotificationApi } from './mocks/notification';
import useAuthStore from '../stores/authStore';

const USE_MOCK_NOTIFICATIONS = import.meta.env.VITE_USE_MOCK_API === 'true';

const createQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page);
  if (params.limit) searchParams.append('limit', params.limit);
  if (params.unreadOnly) searchParams.append('unreadOnly', 'true');
  if (params.type) searchParams.append('type', params.type);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const realNotificationApi = {
  getNotifications: (params = {}) => apiClient(`/notifications${createQueryString(params)}`),
  markAsRead: (id) => apiClient(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => apiClient('/notifications/read-all', { method: 'PATCH' })
};

const mockedNotificationApi = {
  getNotifications: (params = {}) => mockNotificationApi.getNotifications(params, useAuthStore.getState().user),
  markAsRead: (id) => mockNotificationApi.markAsRead(id),
  markAllAsRead: () => mockNotificationApi.markAllAsRead(useAuthStore.getState().user)
};

export const notificationApi = USE_MOCK_NOTIFICATIONS ? mockedNotificationApi : realNotificationApi;
