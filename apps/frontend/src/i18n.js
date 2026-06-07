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
      checkout: "Vente",
      dashboard_today_sales: "Ventes du jour",
      dashboard_today_invoices: "Factures du jour",
      dashboard_stock: "Produits en stock",
      dashboard_monthly_sales: "Ventes du mois",
      dashboard_low_stock: "Stock faible",
      dashboard_unread_notifications: "Notifications non lues",
      dashboard_customer_debts: "Dettes clients",
      dashboard_open_pos: "Ouvrir le POS",
      dashboard_store_overview: "Vue globale du magasin.",
      dashboard_user_summary: "Résumé de vos opérations,",
      dashboard_recent_sales: "Dernières ventes",
      dashboard_view_all: "Voir tout",
      dashboard_recent_amounts: "Montants récents",
      dashboard_low_stock_alerts: "Alertes stock faible",
      dashboard_recent_activity: "Activité récente",
      dashboard_no_sales: "Aucune vente récente.",
      dashboard_no_stock_alerts: "Aucune alerte stock.",
      dashboard_no_activity: "Aucune activité récente.",
      dashboard_no_data: "Aucune donnée à afficher.",
      dashboard_remaining: "restants",
      dashboard_table_invoice: "Facture",
      dashboard_table_customer: "Client",
      dashboard_table_payment: "Paiement",
      dashboard_table_total: "Total",
      payment_cash: "Espèces",
      payment_card: "Carte",
      payment_bankily: "Bankily",
      settings_theme: "Thème",
      settings_theme_light: "Mode Clair",
      settings_theme_dark: "Mode Sombre",
      management: "Gestion",
      account: "Compte",
      invoices: "Factures",
      notifications: "Notifications",
      activity_log: "Journal",
      notification: {
        title: "Notifications",
        description: "Centre in-app conforme au contrat de notifications.",
        mark_all_read: "Tout marquer lu",
        filters: "Filtres",
        unread: "non lues",
        type: "Type",
        show_unread_only: "Afficher seulement les non lues",
        reset: "Réinitialiser",
        mark_read: "Marquer lu",
        empty: "Aucune notification trouvée.",
        error_load: "Impossible de charger les notifications.",
        types: {
          all: "Tous les types",
          low_stock: "Stock faible",
          daily_summary: "Résumé quotidien",
          debt_updated: "Dette client",
          invoice_deleted: "Facture annulée"
        }
      },
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
      checkout: "بيع",
      dashboard_today_sales: "مبيعات اليوم",
      dashboard_today_invoices: "فواتير اليوم",
      dashboard_stock: "المنتجات في المخزن",
      dashboard_monthly_sales: "مبيعات الشهر",
      dashboard_low_stock: "مخزون منخفض",
      dashboard_unread_notifications: "إشعارات غير مقروءة",
      dashboard_customer_debts: "ديون العملاء",
      dashboard_open_pos: "فتح نقطة البيع",
      dashboard_store_overview: "نظرة عامة على المتجر.",
      dashboard_user_summary: "ملخص عملياتك،",
      dashboard_recent_sales: "آخر المبيعات",
      dashboard_view_all: "عرض الكل",
      dashboard_recent_amounts: "المبالغ الأخيرة",
      dashboard_low_stock_alerts: "تنبيهات نقص المخزون",
      dashboard_recent_activity: "النشاط الأخير",
      dashboard_no_sales: "لا توجد مبيعات حديثة.",
      dashboard_no_stock_alerts: "لا توجد تنبيهات للمخزون.",
      dashboard_no_activity: "لا يوجد نشاط حديث.",
      dashboard_no_data: "لا توجد بيانات للعرض.",
      dashboard_remaining: "متبقي",
      dashboard_table_invoice: "الفاتورة",
      dashboard_table_customer: "العميل",
      dashboard_table_payment: "الدفع",
      dashboard_table_total: "المجموع",
      payment_cash: "نقدي",
      payment_card: "بطاقة",
      payment_bankily: "بنكيلي",
      settings_theme: "المظهر",
      settings_theme_light: "الوضع الفاتح",
      settings_theme_dark: "الوضع الداكن",
      management: "الإدارة",
      account: "الحساب",
      invoices: "الفواتير",
      notifications: "الإشعارات",
      activity_log: "سجل النشاط",
      notification: {
        title: "الإشعارات",
        description: "مركز الإشعارات داخل التطبيق.",
        mark_all_read: "تحديد الكل كمقروء",
        filters: "التصفية",
        unread: "غير مقروءة",
        type: "النوع",
        show_unread_only: "عرض غير المقروءة فقط",
        reset: "إعادة تعيين",
        mark_read: "تحديد كمقروء",
        empty: "لم يتم العثور على إشعارات.",
        error_load: "تعذر تحميل الإشعارات.",
        types: {
          all: "كل الأنواع",
          low_stock: "مخزون منخفض",
          daily_summary: "ملخص يومي",
          debt_updated: "دين عميل",
          invoice_deleted: "فاتورة ملغاة"
        }
      },
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
