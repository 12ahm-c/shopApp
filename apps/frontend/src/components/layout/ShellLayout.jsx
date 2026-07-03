import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
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
  Menu,
  X,
  Store,
  Package,
  ReceiptText,
  ShoppingCart,
  Sun,
  Moon,
  Users,
  Truck,
  Wallet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function ShellLayout() {
  const { user, role, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { settings } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();
  const storeName = settings?.storeName || t('store_name');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isRtl = i18n.language === 'ar';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const toggleLanguage = () => {
    const newLang = language === 'fr' ? 'ar' : 'fr';
    setLanguage(newLang);
  };

  const navLinkClassName = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-all font-medium ${
      isActive ? 'text-blue-600 bg-blue-50 dark:bg-slate-800 dark:text-white' : ''
    }`;

  const sidebarContent = (
    <nav className="flex-1 px-4 space-y-1">
      <NavLink to={role === 'admin' ? '/admin' : '/employee'} className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
        <LayoutDashboard className="w-5 h-5 shrink-0" />
        {t('dashboard.title')}
      </NavLink>
      <NavLink to="/pos" className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
        <ShoppingCart className="w-5 h-5 shrink-0" />
        {t('pos.title')}
      </NavLink>
      <NavLink to="/products" className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
        <Package className="w-5 h-5 shrink-0" />
        {t('products')}
      </NavLink>
      {role === 'admin' && (
        <>
          <div className="pt-3 pb-1 px-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('admin.management')}</span>
          </div>
          <NavLink to="/admin/customers" className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
            <Users className="w-5 h-5 shrink-0" />
            {t('customers')}
          </NavLink>
          <NavLink to="/admin/suppliers" className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
            <Truck className="w-5 h-5 shrink-0" />
            {t('suppliers')}
          </NavLink>
          <NavLink to="/employees" className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
            <User className="w-5 h-5 shrink-0" />
            {t('employees')}
          </NavLink>
          <NavLink to="/expenses" className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
            <Wallet className="w-5 h-5 shrink-0" />
            {t('expenses.title')}
          </NavLink>
        </>
      )}
      <div className="pt-3 pb-1 px-3">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('account')}</span>
      </div>
      <NavLink to="/invoices" className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
        <ReceiptText className="w-5 h-5 shrink-0" />
        {t('invoices')}
      </NavLink>
      <NavLink to="/notifications" className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
        <Bell className="w-5 h-5 shrink-0" />
        {t('notifications')}
      </NavLink>
      <NavLink to="/settings" className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
        <Store className="w-5 h-5 shrink-0" />
        {t('settings')}
      </NavLink>
      <NavLink to="/activity-logs" className={navLinkClassName} onClick={() => setSidebarOpen(false)}>
        <Activity className="w-5 h-5 shrink-0" />
        {t('activityLog.title')}
      </NavLink>
    </nav>
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isRtl ? 'right-0 border-l' : 'left-0'
        } ${sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'}`}
        aria-label={t('activityLog.title')}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              S
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              {storeName}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-6">
          {sidebarContent}
        </div>
      </aside>

      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-4 sm:px-6 shadow-sm sticky top-3 z-30 mx-3 mt-3 rounded-b-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              S
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
              {storeName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            to="/notifications"
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={t('notifications')}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" aria-hidden="true"></span>
          </Link>

          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-all"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="uppercase text-xs sm:text-sm">{language}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white text-slate-700 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">{role}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hidden md:flex flex-col py-6 shrink-0">
          {sidebarContent}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
