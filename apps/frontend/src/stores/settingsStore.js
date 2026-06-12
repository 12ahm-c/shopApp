import { create } from 'zustand';
import { settingsApi } from '../api/settings';
import useLanguageStore from './languageStore';

const useSettingsStore = create((set) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await settingsApi.getSettings();
      const settings = response.data;
      set({ settings, loading: false, error: null });
      return settings;
    } catch (err) {
      set({ loading: false, error: err.message || 'Failed to load settings' });
      return null;
    }
  },

  updateSettings: async (data) => {
    try {
      const response = await settingsApi.updateSettings(data);
      const settings = response.data;
      set({ settings, error: null });

      const lang = settings.language;
      if (lang && lang !== useLanguageStore.getState().language) {
        useLanguageStore.getState().setLanguage(lang);
      }

      return settings;
    } catch (err) {
      set({ error: err.message || 'Failed to update settings' });
      throw err;
    }
  }
}));

export default useSettingsStore;
