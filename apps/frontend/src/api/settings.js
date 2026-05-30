import { apiClient } from './client';
import { mockSettingsApi } from './mocks/settings';

const USE_MOCK_SETTINGS = true;

const realSettingsApi = {
  getSettings: () => apiClient('/settings'),
  updateSettings: (data) => apiClient('/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

export const settingsApi = USE_MOCK_SETTINGS ? mockSettingsApi : realSettingsApi;
