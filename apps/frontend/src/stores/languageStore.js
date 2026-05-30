import { create } from 'zustand';
import i18n from '../i18n';

const initialLanguage = 'fr';
const initialDir = 'ltr';

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
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    set({ language: lang, dir });
  }
}));

export default useLanguageStore;
