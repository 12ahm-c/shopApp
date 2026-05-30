import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      welcome: "Bienvenue",
      login: {
        action: "Connexion",
        error: "Erreur de connexion",
        subtitle: "Connectez-vous pour accéder à votre espace"
      },
      phone: "Numéro de téléphone",
      password: "Mot de passe",
      store_name: "ShopManager Pro",
      dashboard: "Tableau de bord",
      pos: "Point de vente",
      customers: "Clients",
      suppliers: "Fournisseurs",
      products: "Produits",
      settings: "Paramètres",
      employees: "Employés",
      logout: "Déconnexion",
      profile: {
        title: "Profil",
        description: "Gérez vos informations personnelles et votre sécurité.",
        accountInfo: "Informations du compte",
        success: "Profil mis à jour avec succès.",
        fullName: "Nom complet",
        phoneNumber: "Numéro de téléphone",
        phoneHelp: "Le numéro de téléphone ne peut être modifié que par l'administrateur.",
        newPassword: "Nouveau mot de passe (optionnel)",
        passwordPlaceholder: "Laisser vide pour ne pas changer",
        saveChanges: "Enregistrer les modifications"
      },
      employeesPage: {
        description: "Gérez les accès et les rôles de votre équipe.",
        addButton: "Ajouter un employé",
        addTitle: "Ajouter un employé",
        searchPlaceholder: "Rechercher par nom ou téléphone...",
        emptyState: "Aucun employé trouvé.",
        close: "Fermer",
        cancel: "Annuler",
        create: "Créer",
        headers: {
          name: "Nom",
          phone: "Téléphone",
          role: "Rôle",
          salary: "Salaire"
        },
        fields: {
          name: "Nom complet",
          phone: "Numéro de téléphone",
          role: "Rôle",
          salary: "Salaire"
        },
        roles: {
          admin: "Admin",
          employee: "Employé"
        }
      }
    }
  },
  ar: {
    translation: {
      welcome: "مرحباً",
      login: {
        action: "تسجيل الدخول",
        error: "خطأ في تسجيل الدخول",
        subtitle: "سجّل الدخول للوصول إلى مساحتك"
      },
      phone: "رقم الهاتف",
      password: "كلمة المرور",
      store_name: "شوب مانجر برو",
      dashboard: "لوحة القيادة",
      pos: "نقطة البيع",
      customers: "العملاء",
      suppliers: "الموردون",
      products: "المنتجات",
      settings: "الإعدادات",
      employees: "الموظفون",
      logout: "تسجيل الخروج",
      profile: {
        title: "الملف الشخصي",
        description: "أدر معلوماتك الشخصية وأمان حسابك.",
        accountInfo: "معلومات الحساب",
        success: "تم تحديث الملف الشخصي بنجاح.",
        fullName: "الاسم الكامل",
        phoneNumber: "رقم الهاتف",
        phoneHelp: "لا يمكن تعديل رقم الهاتف إلا بواسطة المدير.",
        newPassword: "كلمة مرور جديدة (اختياري)",
        passwordPlaceholder: "اتركه فارغاً إذا كنت لا تريد التغيير",
        saveChanges: "حفظ التعديلات"
      },
      employeesPage: {
        description: "أدر صلاحيات وأدوار فريقك.",
        addButton: "إضافة موظف",
        addTitle: "إضافة موظف",
        searchPlaceholder: "ابحث بالاسم أو رقم الهاتف...",
        emptyState: "لم يتم العثور على أي موظف.",
        close: "إغلاق",
        cancel: "إلغاء",
        create: "إنشاء",
        headers: {
          name: "الاسم",
          phone: "الهاتف",
          role: "الدور",
          salary: "الراتب"
        },
        fields: {
          name: "الاسم الكامل",
          phone: "رقم الهاتف",
          role: "الدور",
          salary: "الراتب"
        },
        roles: {
          admin: "مدير",
          employee: "موظف"
        }
      }
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
