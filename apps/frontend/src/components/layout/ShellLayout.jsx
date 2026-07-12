import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useLanguageStore from '../../stores/languageStore';
import useSettingsStore from '../../stores/settingsStore';
import useThemeStore from '../../stores/themeStore';
import {
  Activity,
  Bell,
  LayoutDashboard,
  LogOut,
  User,
  Globe,
  Store,
  Package,
  ReceiptText,
  ShoppingCart,
  Sun,
  Moon,
  Users,
  Truck,
  Wallet,
  Settings,
  MoreHorizontal,
  X,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../../api/notification';
import { formatDateTime } from '../../lib/format';

export default function ShellLayout() {
  const { user, role, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { settings } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();
  const storeName = settings?.storeName || t('store_name');
  const isRtl = i18n.language === 'ar';
  const location = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await notificationApi.getNotifications({ limit: 20 });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    if (showNotifications) loadNotifications();
  }, [showNotifications, loadNotifications]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const toggleLanguage = () => {
    const newLang = language === 'fr' ? 'ar' : 'fr';
    setLanguage(newLang);
  };

  const mainNavItems = [
    { to: role === 'admin' ? '/admin' : '/employee', icon: LayoutDashboard, label: t('dashboard.title') },
    { to: '/products', icon: Package, label: t('products') },
    { to: '/pos', icon: ShoppingCart, label: t('pos.title') },
    { to: '/invoices', icon: ReceiptText, label: t('invoices') },
  ];

  const moreNavItems = [
    { to: '/settings', icon: Settings, label: t('settings') },
    { to: '/activity-logs', icon: Activity, label: t('activityLog.title') },
    ...(role === 'admin' ? [
      { to: '/admin/customers', icon: Users, label: t('customers') },
      { to: '/admin/suppliers', icon: Truck, label: t('suppliers') },
      { to: '/employees', icon: User, label: t('employees') },
      { to: '/expenses', icon: Wallet, label: t('expenses.title') },
    ] : []),
  ];

  const isMoreActive = moreNavItems.some(item => location.pathname === item.to);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* ========== MOBILE LAYOUT ========== */}
      <header className="md:hidden flex items-center justify-between px-4 h-12 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white">{storeName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-500"></span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
          </button>
        </div>
      </header>

      <main className="md:hidden flex-1 overflow-y-auto p-4 pb-20 scrollbar-hide">
        <Outlet />
      </main>

      {/* ========== DESKTOP LAYOUT ========== */}
      <header className="hidden md:flex h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 items-center justify-between px-6 shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/25">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              {storeName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNotifications(true)}
            className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={t('notifications')}
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-500"></span>
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-all text-slate-600 dark:text-slate-400"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="uppercase">{language}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors text-slate-600 dark:text-slate-400"
            title={t('logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="hidden md:block flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ========== BOTTOM TAB BAR ========== */}
      <nav className="md:hidden shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-40">
        <div className="flex items-center h-16 px-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to ||
              (item.to === (role === 'admin' ? '/admin' : '/employee') && location.pathname === '/admin');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-14 transition-all active:scale-[0.92] ${
                  isActive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-14 transition-all active:scale-[0.92] ${
              isMoreActive
                ? 'text-green-600 dark:text-green-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${isMoreActive ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-tight">{t('more')}</span>
          </button>
        </div>
      </nav>

      {/* ========== NOTIFICATIONS PANEL ========== */}
      {showNotifications && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-950 shadow-2xl flex flex-col animate-slide-left">
            <div className="flex items-center justify-between px-5 h-14 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('notifications')}</h2>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-[0.95]"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingNotifs ? (
                <div className="flex items-center justify-center p-10">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 text-slate-400">
                  <Bell className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">{t('notification.noNotifications')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.map((notif) => (
                    <div key={notif._id} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatDateTime(notif.createdAt)}</p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== PLUS MENU ========== */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-950 rounded-t-3xl max-h-[70vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('more')}</h2>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-[0.95]"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-3">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setShowMoreMenu(false)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all active:scale-[0.95] ${
                        isActive
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                    </Link>
                  );
                })}

                <button
                  type="button"
                  onClick={() => { toggleLanguage(); setShowMoreMenu(false); }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-[0.95]"
                >
                  <Globe className="w-6 h-6" />
                  <span className="text-xs font-medium text-center leading-tight">{language === 'fr' ? 'العربية' : 'Français'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { logout(); setShowMoreMenu(false); }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-[0.95]"
                >
                  <LogOut className="w-6 h-6" />
                  <span className="text-xs font-medium text-center leading-tight">{t('logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
