import { useCallback, useEffect, useState } from 'react';
import {
  CreditCard,
  ReceiptText,
  Loader2,
  TrendingUp,
  Wallet,
  Package,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '../api/dashboard';
import useAuthStore from '../stores/authStore';
import { formatMoney } from '../lib/format';

function StatCard({ icon: Icon, label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/20'
  };

  return (
    <div className="bg-card backdrop-blur-sm rounded-2xl p-4 border border-surface-border">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold text-text-primary tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function MiniDashboard() {
  const { t } = useTranslation();
  const { role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = role === 'admin';

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = isAdmin
        ? await dashboardApi.getAdminDashboard()
        : await dashboardApi.getEmployeeDashboard();
      if (!response.success) {
        throw new Error(response.error?.message || t('dashboard.loadError'));
      }
      setStats(response.data?.stats || null);
    } catch (err) {
      setError(err.message || t('dashboard.loadError'));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, t]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-text-primary">{t('dashboard.title')}</h1>

      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-surface-border bg-card p-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={CreditCard} label={t('dashboard.todaySales')} value={formatMoney(stats.todaySales)} tone="blue" />
            <StatCard icon={ReceiptText} label={t('dashboard.todayInvoices')} value={stats.todayOrders} tone="cyan" />
            <StatCard icon={Wallet} label={t('dashboard.monthlySales')} value={formatMoney(stats.monthlySales)} tone="emerald" />
            {isAdmin ? (
              <StatCard icon={AlertTriangle} label={t('dashboard.lowStock')} value={stats.lowStockCount} tone="amber" />
            ) : (
              <StatCard icon={TrendingUp} label={t('dashboard.profits')} value={formatMoney(stats.netProfit || 0)} tone="emerald" />
            )}
          </div>

          <Link
            to="/pos"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
          >
            {t('pos.title')}
          </Link>
        </>
      )}
    </div>
  );
}
