import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CreditCard,
  Loader2,
  Package,
  ReceiptText,
  ShoppingBag,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '../api/dashboard';
import useAuthStore from '../stores/authStore';
import { formatMoney, formatDateTime } from '../lib/format';

function StatCard({ icon: Icon, label, value, tone = 'green', trend, trendValue }) {
  const tones = {
    green: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, label, to, tone = 'green' }) {
  const tones = {
    green: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
  };

  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all active:scale-[0.97]`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tones[tone]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">{label}</span>
    </Link>
  );
}

function RecentSalesList({ sales }) {
  const { t } = useTranslation();

  if (!sales.length) {
    return (
      <div className="p-8 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-slate-500">{t('dashboard.noSales')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {sales.map((sale) => (
        <Link
          key={sale._id}
          to={`/invoices/${sale._id}`}
          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
              <ReceiptText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">#{sale.invoiceNumber}</p>
              <p className="text-xs text-slate-500 truncate">{sale.customerName}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-sm text-slate-900 dark:text-white">{formatMoney(sale.totalAmount)}</p>
            <p className="text-[10px] text-slate-500">{formatDateTime(sale.createdAt)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function LowStockList({ products }) {
  const { t } = useTranslation();

  if (!products.length) {
    return (
      <div className="p-8 text-center">
        <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-slate-500">{t('dashboard.noStockAlerts')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {products.map((product) => (
        <Link
          key={product._id}
          to={`/products/${product._id}`}
          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{product.name}</p>
            <p className="text-xs text-slate-500">{t('dashboard.threshold')}: {product.alertThreshold}</p>
          </div>
          <span className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {product.quantity} {t('dashboard.remaining')}
          </span>
        </Link>
      ))}
    </div>
  );
}

function ActivityList({ activity }) {
  const { t } = useTranslation();

  if (!activity.length) {
    return (
      <div className="p-8 text-center">
        <Activity className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-slate-500">{t('dashboard.noActivity')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {activity.map((item) => (
        <div key={item._id} className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{item.details}</p>
            <span className="text-xs text-slate-500 shrink-0">{formatDateTime(item.timestamp)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{item.userName} - {item.action}</p>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { role, user } = useAuthStore();
  const [dashboardState, setDashboardState] = useState({
    status: 'loading',
    data: null,
    error: null
  });

  const isAdmin = role === 'admin';

  const loadDashboard = useCallback(async () => {
    setDashboardState({ status: 'loading', data: null, error: null });
    try {
      const response = isAdmin
        ? await dashboardApi.getAdminDashboard()
        : await dashboardApi.getEmployeeDashboard();
      if (!response.success) {
        throw new Error(response.error?.message || t('dashboard.loadError'));
      }
      setDashboardState({ status: 'success', data: response.data, error: null });
    } catch (error) {
      setDashboardState({
        status: 'error',
        data: null,
        error: error.message || t('dashboard.loadError')
      });
    }
    }, [isAdmin, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadDashboard();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  const stats = dashboardState.data?.stats;
  const recentSales = useMemo(
    () => dashboardState.data?.recentSales ?? [],
    [dashboardState.data]
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning', { name: user?.name?.split(' ')[0] });
    if (hour < 18) return t('dashboard.greeting.afternoon', { name: user?.name?.split(' ')[0] });
    return t('dashboard.greeting.evening', { name: user?.name?.split(' ')[0] });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{getGreeting()}</h1>
            <p className="mt-1 text-green-100 text-sm">{t('dashboard.welcomeBack')}</p>
          </div>
          <Link
            to="/pos"
            className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-colors active:scale-[0.95]"
          >
            <ShoppingCart className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {dashboardState.status === 'loading' && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-7 w-7 animate-spin text-green-500" />
        </div>
      )}

      {dashboardState.status === 'error' && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {dashboardState.error}
        </div>
      )}

      {dashboardState.status === 'success' && stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={CreditCard} label={t('dashboard.todaySales')} value={formatMoney(stats.todaySales)} tone="green" trend="up" trendValue="+12%" />
            <StatCard icon={ReceiptText} label={t('dashboard.todayInvoices')} value={stats.todayOrders} tone="blue" />
            {isAdmin ? (
              <>
                <StatCard icon={Package} label={t('dashboard.stockProducts')} value={stats.totalProducts} tone="slate" />
                <StatCard icon={AlertTriangle} label={t('dashboard.lowStock')} value={stats.lowStockCount} tone="amber" />
              </>
            ) : (
              <>
                <StatCard icon={Wallet} label={t('dashboard.monthlySales')} value={formatMoney(stats.monthlySales)} tone="emerald" />
                <StatCard icon={Bell} label={t('dashboard.unreadNotifications')} value={dashboardState.data.unreadNotifications} tone="amber" />
              </>
            )}
          </div>

          {/* Admin Extra Stats */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={CreditCard} label={t('dashboard.monthlySales')} value={formatMoney(stats.monthlySales)} tone="emerald" trend="up" trendValue="+8%" />
              <StatCard icon={Users} label={t('dashboard.customers')} value={stats.totalCustomers} tone="blue" />
              <StatCard icon={Activity} label={t('dashboard.clientDebts')} value={formatMoney(stats.outstandingDebt)} tone="rose" />
              <StatCard icon={TrendingUp} label={t('dashboard.profits')} value={formatMoney(stats.monthlySales - (stats.totalExpenses || 0))} tone="green" />
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{t('dashboard.quickActions')}</h2>
            <div className="grid grid-cols-4 gap-3">
              <QuickActionCard icon={ShoppingCart} label={t('pos.title')} to="/pos" tone="green" />
              <QuickActionCard icon={Package} label={t('products')} to="/products" tone="blue" />
              <QuickActionCard icon={ReceiptText} label={t('invoices')} to="/invoices" tone="amber" />
              {isAdmin && (
                <QuickActionCard icon={Users} label={t('customers')} to="/admin/customers" tone="rose" />
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-white">{t('dashboard.recentSales')}</h2>
              <Link className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700" to="/invoices">
                {t('dashboard.viewAll')}
              </Link>
            </div>
            <RecentSalesList sales={recentSales.slice(0, 5)} />
          </section>

          {/* Admin Sections */}
          {isAdmin && (
            <div className="grid gap-4 md:grid-cols-2">
              <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-bold text-slate-900 dark:text-white">{t('dashboard.lowStockAlerts')}</h2>
                </div>
                <LowStockList products={dashboardState.data.lowStockProducts ?? []} />
              </section>

              <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="font-bold text-slate-900 dark:text-white">{t('dashboard.recentActivity')}</h2>
                </div>
                <ActivityList activity={dashboardState.data.recentActivity ?? []} />
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
