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

function StatCard({ icon: Icon, label, value, tone = 'blue', trend, trendValue }) {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20',
    slate: 'bg-white/5 text-slate-400 ring-1 ring-white/10',
    cyan: 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20'
  };

  return (
    <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-[13px] text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-white tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, label, to, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
    cyan: 'bg-cyan-500/10 text-cyan-400'
  };

  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 active:scale-[0.97]"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[11px] font-medium text-slate-400 text-center">{label}</span>
    </Link>
  );
}

function RecentSalesList({ sales }) {
  const { t } = useTranslation();

  if (!sales.length) {
    return (
      <div className="p-8 text-center">
        <ShoppingBag className="w-10 h-10 mx-auto text-slate-700 mb-3" />
        <p className="text-sm text-slate-500">{t('dashboard.noSales')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {sales.map((sale) => (
        <Link
          key={sale._id}
          to={`/invoices/${sale._id}`}
          className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <ReceiptText className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">#{sale.invoiceNumber}</p>
              <p className="text-xs text-slate-500 truncate">{sale.customerName}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-sm text-white tabular-nums">{formatMoney(sale.totalAmount)}</p>
            <p className="text-[10px] text-slate-600">{formatDateTime(sale.createdAt)}</p>
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
        <Package className="w-10 h-10 mx-auto text-slate-700 mb-3" />
        <p className="text-sm text-slate-500">{t('dashboard.noStockAlerts')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {products.map((product) => (
        <Link
          key={product._id}
          to={`/products/${product._id}`}
          className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
        >
          <div className="min-w-0">
            <p className="font-medium text-sm text-white truncate">{product.name}</p>
            <p className="text-xs text-slate-500">{t('dashboard.threshold')}: {product.alertThreshold}</p>
          </div>
          <span className="shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
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
        <Activity className="w-10 h-10 mx-auto text-slate-700 mb-3" />
        <p className="text-sm text-slate-500">{t('dashboard.noActivity')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {activity.map((item) => (
        <div key={item._id} className="px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-sm text-white truncate">{item.details}</p>
            <span className="text-xs text-slate-600 shrink-0">{formatDateTime(item.timestamp)}</span>
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
    <div className="space-y-5">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0zMCAyNWE5IDkgMCAxIDAtMTggMCA5IDkgMCAwIDAgMTggMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{getGreeting()}</h1>
            <p className="mt-1 text-blue-100 text-sm">{t('dashboard.welcomeBack')}</p>
          </div>
          <Link
            to="/pos"
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors active:scale-[0.95]"
          >
            <ShoppingCart className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {dashboardState.status === 'loading' && (
        <div className="flex items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] p-12">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      )}

      {dashboardState.status === 'error' && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
          {dashboardState.error}
        </div>
      )}

      {dashboardState.status === 'success' && stats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={CreditCard} label={t('dashboard.todaySales')} value={formatMoney(stats.todaySales)} tone="blue" trend="up" trendValue="+12%" />
            <StatCard icon={ReceiptText} label={t('dashboard.todayInvoices')} value={stats.todayOrders} tone="cyan" />
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
              <StatCard icon={TrendingUp} label={t('dashboard.profits')} value={formatMoney(stats.monthlySales - (stats.totalExpenses || 0))} tone="emerald" />
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-[15px] font-semibold text-white mb-3">{t('dashboard.quickActions')}</h2>
            <div className="grid grid-cols-4 gap-3">
              <QuickActionCard icon={ShoppingCart} label={t('pos.title')} to="/pos" tone="blue" />
              <QuickActionCard icon={Package} label={t('products')} to="/products" tone="cyan" />
              <QuickActionCard icon={ReceiptText} label={t('invoices')} to="/invoices" tone="amber" />
              {isAdmin && (
                <QuickActionCard icon={Users} label={t('customers')} to="/admin/customers" tone="rose" />
              )}
            </div>
          </div>

          {/* Recent Sales */}
          <section className="bg-white/[0.03] rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h2 className="font-semibold text-white">{t('dashboard.recentSales')}</h2>
              <Link className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors" to="/invoices">
                {t('dashboard.viewAll')}
              </Link>
            </div>
            <RecentSalesList sales={recentSales.slice(0, 5)} />
          </section>

          {/* Admin Sections */}
          {isAdmin && (
            <div className="grid gap-4 md:grid-cols-2">
              <section className="bg-white/[0.03] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <h2 className="font-semibold text-white">{t('dashboard.lowStockAlerts')}</h2>
                </div>
                <LowStockList products={dashboardState.data.lowStockProducts ?? []} />
              </section>

              <section className="bg-white/[0.03] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <h2 className="font-semibold text-white">{t('dashboard.recentActivity')}</h2>
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
