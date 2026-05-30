import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      "welcome": "Bienvenue",
      "login": "Connexion",
      "phone": "Numéro de téléphone",
      "password": "Mot de passe",
      "store_name": "ShopManager Pro",
      "dashboard": "Tableau de bord",
      "pos": "Point de vente",
      "employees": "Employés",
      "logout": "Déconnexion",
      "profile": "Profil"
    }
  },
  ar: {
    translation: {
      "welcome": "مرحباً",
      "login": "تسجيل الدخول",
      "phone": "رقم الهاتف",
      "password": "كلمة المرور",
      "store_name": "شوب مانجر برو",
      "dashboard": "لوحة القيادة",
      "pos": "نقطة البيع",
      "employees": "الموظفين",
      "logout": "تسجيل الخروج",
      "profile": "الملف الشخصي"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "fr",
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
