import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useLanguageStore from '../../stores/languageStore';
import useSettingsStore from '../../stores/settingsStore';
import {
  Activity,
  Bell,
  LayoutDashboard,
  User,
  Globe,
  Menu,
  Moon,
  Sun,
  Store,
  Package,
  ReceiptText,
  ShoppingCart,
  Users,
  Truck,
  X,
  Wallet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ShellLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, role } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { settings, updateSettings } = useSettingsStore();
  const { t } = useTranslation();

  const toggleTheme = () => {
    const currentTheme = settings?.theme || 'light';
    updateSettings({ theme: currentTheme === 'light' ? 'dark' : 'light' });
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'ar' : 'fr');
  };

  const navLinkClassName = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-all font-medium ${
      isActive ? 'text-blue-600 bg-blue-50 dark:bg-slate-800 dark:text-white' : ''
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 shadow-sm sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              S
            </div>
            <span className="font-bold text-lg hidden sm:block tracking-tight text-slate-900 dark:text-white">
              {settings?.storeName || t('store_name')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" aria-hidden="true"></span>
          </Link>

          <button 
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-all"
          >
            <Globe className="w-4 h-4" />
            <span className="uppercase">{language}</span>
          </button>

          <button 
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            title={settings?.theme === 'dark' ? t('settings_theme_light') : t('settings_theme_dark')}
          >
            {settings?.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">{role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside className={`w-64 border-e border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col py-6 absolute md:static inset-y-0 start-0 z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'} md:translate-x-0 md:rtl:translate-x-0 print:hidden`}>
          <div className="flex items-center justify-between px-4 pb-4 md:hidden">
            <span className="font-bold text-lg text-slate-900 dark:text-white">{settings?.storeName || t('store_name')}</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto" onClick={(e) => {
            if (e.target.closest('a')) setIsMobileMenuOpen(false);
          }}>
            <NavLink to={role === 'admin' ? '/admin' : '/employee'} className={navLinkClassName}>
              <LayoutDashboard className="w-5 h-5" />
              {t('dashboard')}
            </NavLink>
            <NavLink to="/pos" className={navLinkClassName}>
              <ShoppingCart className="w-5 h-5" />
              {t('pos')}
            </NavLink>
            <NavLink to="/products" className={navLinkClassName}>
              <Package className="w-5 h-5" />
              {t('products')}
            </NavLink>
            {role === 'admin' && (
              <>
                <div className="pt-3 pb-1 px-3">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('management')}</span>
                </div>
                <NavLink to="/admin/customers" className={navLinkClassName}>
                  <Users className="w-5 h-5" />
                  {t('customers')}
                </NavLink>
                <NavLink to="/admin/suppliers" className={navLinkClassName}>
                  <Truck className="w-5 h-5" />
                  {t('suppliers')}
                </NavLink>
                <NavLink to="/admin/expenses" className={navLinkClassName}>
                  <Wallet className="w-5 h-5" />
                  Dépenses
                </NavLink>
                <NavLink to="/employees" className={navLinkClassName}>
                  <User className="w-5 h-5" />
                  {t('employees')}
                </NavLink>
                <NavLink to="/settings" className={navLinkClassName}>
                  <Store className="w-5 h-5" />
                  {t('settings')}
                </NavLink>
              </>
            )}
            <div className="pt-3 pb-1 px-3">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('account')}</span>
            </div>
            <NavLink to="/invoices" className={navLinkClassName}>
              <ReceiptText className="w-5 h-5" />
              {t('invoices')}
            </NavLink>
            <NavLink to="/notifications" className={navLinkClassName}>
              <Bell className="w-5 h-5" />
              {t('notifications')}
            </NavLink>
            <NavLink to="/profile" className={navLinkClassName}>
              <User className="w-5 h-5" />
              {t('profile.title')}
            </NavLink>
            <NavLink to="/activity-logs" className={navLinkClassName}>
              <Activity className="w-5 h-5" />
              {t('activity_log')}
            </NavLink>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
