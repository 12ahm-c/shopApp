import { create } from 'zustand';

const THEME_KEY = 'shopmanager_theme';

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* ignore */ }
  return 'light';
};

const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const initial = getInitialTheme();
applyTheme(initial);

const useThemeStore = create((set) => ({
  theme: initial,

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch { /* ignore */ }
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch { /* ignore */ }
      return { theme: next };
    });
  }
}));

export default useThemeStore;
