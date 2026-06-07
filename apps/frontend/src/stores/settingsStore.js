import { create } from 'zustand';
import { settingsApi } from '../api/settings';
import i18n from '../i18n';

const useSettingsStore = create((set) => ({
  settings: null,
  loading: false,
  error: null,
  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await settingsApi.getSettings();
      if (response.success) {
        const data = response.data;
        set({ settings: data, loading: false });
        
        // Apply global effects
        if (data.language && i18n.language !== data.language) {
          i18n.changeLanguage(data.language);
        }
        
        if (data.theme) {
          if (data.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } else {
        set({ error: 'Failed to load settings', loading: false });
      }
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
  updateSettings: (newSettings) => {
    set({ settings: newSettings });
    // Apply immediate global effects when updating
    if (newSettings.language && i18n.language !== newSettings.language) {
      i18n.changeLanguage(newSettings.language);
    }
    
    if (newSettings.theme) {
      if (newSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
}));

export default useSettingsStore;
