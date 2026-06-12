import { apiClient } from './client';
import { mockAuthApi } from './mocks/auth';

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_API === 'true';

const realAuthApi = {
  login: (phone, password) => apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password })
  }),
  getMe: () => apiClient('/auth/me'),
  logout: () => apiClient('/auth/logout', { method: 'POST' }),
  refreshToken: () => apiClient('/auth/refresh', { method: 'POST' }),
  updateProfile: (data) => apiClient('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

const mockedAuthApi = {
  ...mockAuthApi,
  updateProfile: async (data, currentUser) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      success: true,
      data: {
        ...currentUser,
        ...(data.name ? { name: data.name } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.password ? { password: '***' } : {})
      },
      error: null,
      meta: null
    };
  }
};

export const authApi = USE_MOCK_AUTH ? mockedAuthApi : realAuthApi;
