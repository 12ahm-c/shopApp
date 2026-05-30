import { create } from 'zustand';
import i18n from '../i18n';

const useLanguageStore = create((set) => ({
  language: 'fr',
  dir: 'ltr',
  
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    set({ language: lang, dir });
  }
}));

export default useLanguageStore;
