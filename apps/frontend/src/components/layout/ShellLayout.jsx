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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { notificationApi } from '../../api/notification';
import { formatDateTime } from '../../lib/format';

const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-[calc(100%-2rem)] max-w-md">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="animate-slide-down pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border border-border backdrop-blur-xl bg-card text-card-foreground"
          >
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500' :
              toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
            }`} />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="p-1 rounded-lg hover:bg-secondary shrink-0">
              <X className="w-4 h-4 text-secondary-foreground" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default function ShellLayout() {
  const { user, role, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { settings } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();
  const storeName = settings?.storeName || t('store_name');
  const storeLogo = settings?.storeLogo || null;
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

  const renderLogo = (size = 'w-8 h-8') => {
    if (storeLogo) {
      return <img src={storeLogo} alt={storeName} className={`${size} rounded-xl object-cover`} />;
    }
    return (
      <div className={`${size} bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25`}>
        <Store className="w-1/2 h-1/2 text-white" />
      </div>
    );
  };

  return (
    <ToastProvider>
      <div dir={isRtl ? 'rtl' : 'ltr'} className="flex flex-col h-dvh bg-background overflow-hidden">
        {/* ========== MOBILE HEADER ========== */}
        <header className="md:hidden flex items-center justify-between px-5 h-14 bg-card/80 backdrop-blur-xl border-b border-border shrink-0 z-10 safe-area-top">
          <div className="flex items-center gap-3">
            {renderLogo('w-8 h-8')}
            <span className="font-semibold text-[15px] text-text-primary">{storeName}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              className="relative p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Bell className="w-5 h-5 text-secondary-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-secondary-foreground" /> : <Moon className="w-5 h-5 text-secondary-foreground" />}
            </button>
          </div>
        </header>

        {/* ========== MOBILE MAIN ========== */}
        <main className="md:hidden flex-1 min-h-0 overflow-y-auto p-5 scrollbar-hide">
          <Outlet />
        </main>

        {/* ========== DESKTOP LAYOUT ========== */}
        <header className="hidden md:flex h-16 border-b border-border bg-card/80 backdrop-blur-xl items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            {renderLogo('w-9 h-9')}
            <span className="font-bold text-lg tracking-tight text-text-primary">
              {storeName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              className="relative p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              title={t('notifications')}
            >
              <Bell className="w-5 h-5 text-secondary-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></span>
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent hover:bg-surface-hover text-sm font-medium transition-colors text-muted-foreground"
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span className="uppercase">{language}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-secondary-foreground" /> : <Moon className="w-5 h-5 text-secondary-foreground" />}
            </button>

            <div className="h-6 w-px bg-surface-border mx-1"></div>

            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center ring-1 ring-primary/20">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-text-primary">{user.name}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-2.5 rounded-xl bg-secondary hover:bg-destructive/10 hover:text-destructive transition-colors text-secondary-foreground"
              title={t('logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="hidden md:block flex-1 min-h-0 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* ========== BOTTOM TAB BAR ========== */}
        <nav className="md:hidden shrink-0 z-40 safe-area-bottom">
          <div className="bg-card/95 backdrop-blur-xl border-t border-border">
            <div className="flex items-center h-16 px-2">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to ||
                  (item.to === (role === 'admin' ? '/admin' : '/employee') && location.pathname === '/admin');
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex flex-col items-center justify-center gap-1 flex-1 h-14 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground active:text-secondary-foreground'
                    }`}
                  >
                    <div className={`p-2 rounded-xl transition-all duration-200 ${
                      isActive ? 'bg-primary/10 shadow-lg shadow-primary/10' : ''
                    }`}>
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                    </div>
                    <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => setShowMoreMenu(true)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-14 rounded-2xl transition-all duration-200 ${
                  isMoreActive
                    ? 'text-primary'
                    : 'text-muted-foreground active:text-secondary-foreground'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isMoreActive ? 'bg-primary/10 shadow-lg shadow-primary/10' : ''
                }`}>
                  <MoreHorizontal className="w-5 h-5" strokeWidth={isMoreActive ? 2.2 : 1.8} />
                </div>
                <span className="text-[10px] font-medium leading-tight">{t('more')}</span>
              </button>
            </div>
          </div>
        </nav>

        {/* ========== NOTIFICATIONS PANEL ========== */}
        {showNotifications && (
          <div className="fixed inset-0 z-50 animate-fade-in">
            <div
              className="absolute inset-0"
              onClick={() => setShowNotifications(false)}
            />
            <div className="absolute top-16 right-3 left-3 sm:left-auto sm:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[70vh] animate-slide-down overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
                <h2 className="text-sm font-bold text-card-foreground">{t('notifications')}</h2>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <X className="w-4 h-4 text-secondary-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                    <Bell className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-xs">{t('notification.noNotifications')}</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => {
                          if (!notif.read) {
                            notificationApi.markAsRead(notif._id);
                            notif.read = true;
                          }
                        }}
                        className={`px-4 py-3 transition-colors border-b border-border last:border-b-0 cursor-pointer ${
                          notif.read ? 'bg-card' : 'bg-primary/5'
                        } hover:bg-secondary/50`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.read ? 'bg-secondary' : 'bg-primary/10'
                          }`}>
                            <Bell className={`w-3.5 h-3.5 ${notif.read ? 'text-muted-foreground' : 'text-primary'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-medium line-clamp-3 ${notif.read ? 'text-muted-foreground' : 'text-card-foreground'}`}>
                              {notif.message}
                            </p>
                            {notif.details && (
                              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{notif.details}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(notif.createdAt)}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 shadow-lg shadow-blue-500/50"></div>
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
          <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMoreMenu(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl max-h-[70vh] flex flex-col animate-slide-up">
              <div className="flex items-center justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="flex items-center justify-between px-5 pb-4 border-b border-border">
                <h2 className="text-lg font-bold text-card-foreground">{t('more')}</h2>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <X className="w-5 h-5 text-secondary-foreground" />
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
                        className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl transition-all duration-200 ${
                          isActive
                            ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-card-foreground'
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
                    className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-card-foreground transition-all duration-200"
                  >
                    <Globe className="w-6 h-6" />
                    <span className="text-xs font-medium text-center leading-tight">{language === 'fr' ? 'العربية' : 'Français'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { logout(); setShowMoreMenu(false); }}
                    className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200"
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
    </ToastProvider>
  );
}
