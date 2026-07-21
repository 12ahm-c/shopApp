import { create } from 'zustand';
import i18n from '../i18n';

const LANG_KEY = 'shopmanager_language';

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'ar' || saved === 'fr') return saved;
  } catch { /* ignore */ }
  return 'fr';
}

function getDir(lang) {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

const initialLanguage = getInitialLanguage();
const initialDir = getDir(initialLanguage);

i18n.changeLanguage(initialLanguage);

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
  document.documentElement.dir = initialDir;
}

const useLanguageStore = create((set) => ({
  language: initialLanguage,
  dir: initialDir,

  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    const dir = getDir(lang);
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch { /* ignore */ }
    set({ language: lang, dir });
  }
}));

export default useLanguageStore;
