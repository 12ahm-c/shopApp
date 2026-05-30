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
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import useAuthStore from '../stores/authStore';

const currencyFormatter = new Intl.NumberFormat('fr-FR');

const formatMoney = (amount) => `${currencyFormatter.format(Number(amount || 0))} MRU`;

const formatDateTime = (isoDate) => {
  if (!isoDate) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoDate));
};

const paymentLabels = {
  cash: 'Especes',
  card: 'Carte',
  bankily: 'Bankily'
};

function StatCard({ icon: Icon, label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RecentSalesTable({ sales }) {
  if (!sales.length) {
    return <div className="p-8 text-center text-sm text-slate-500">Aucune vente recente.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Facture</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Paiement</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {sales.map((sale) => (
            <tr key={sale._id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
              <td className="px-4 py-3">
                <Link className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400" to={`/invoices/${sale._id}`}>
                  #{sale.invoiceNumber}
                </Link>
                <div className="text-xs text-slate-500">{formatDateTime(sale.createdAt)}</div>
              </td>
              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{sale.customerName}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{paymentLabels[sale.paymentMethod] || sale.paymentMethod}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">{formatMoney(sale.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LowStockList({ products }) {
  if (!products.length) {
    return <div className="p-6 text-sm text-slate-500">Aucune alerte stock.</div>;
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {products.map((product) => (
        <Link
          key={product._id}
          to={`/products/${product._id}`}
          className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-950/50"
        >
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
            <p className="text-xs text-slate-500">Seuil: {product.alertThreshold}</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {product.quantity} restants
          </span>
        </Link>
      ))}
    </div>
  );
}

function ActivityList({ activity }) {
  if (!activity.length) {
    return <div className="p-6 text-sm text-slate-500">Aucune activite recente.</div>;
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {activity.map((item) => (
        <div key={item._id} className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-slate-900 dark:text-white">{item.details}</p>
            <span className="text-xs text-slate-500">{formatDateTime(item.timestamp)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{item.userName} - {item.action}</p>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
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
        throw new Error(response.error?.message || 'Impossible de charger le tableau de bord.');
      }
      setDashboardState({ status: 'success', data: response.data, error: null });
    } catch (error) {
      setDashboardState({
        status: 'error',
        data: null,
        error: error.message || 'Impossible de charger le tableau de bord.'
      });
    }
  }, [isAdmin]);

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
  const recentMax = useMemo(
    () => Math.max(1, ...recentSales.map((sale) => sale.totalAmount)),
    [recentSales]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin ? 'Vue globale du magasin.' : `Resume de vos operations, ${user?.name ?? 'utilisateur'}.`}
          </p>
        </div>
        <Link
          to="/pos"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <ShoppingBag className="h-4 w-4" />
          Ouvrir le POS
        </Link>
      </div>

      {dashboardState.status === 'loading' && (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      )}

      {dashboardState.status === 'error' && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {dashboardState.error}
        </div>
      )}

      {dashboardState.status === 'success' && stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={CreditCard} label="Ventes du jour" value={formatMoney(stats.todaySales)} tone="emerald" />
            <StatCard icon={ReceiptText} label="Factures du jour" value={stats.todayOrders} tone="blue" />
            <StatCard icon={Package} label={isAdmin ? 'Produits en stock' : 'Ventes du mois'} value={isAdmin ? stats.totalProducts : formatMoney(stats.monthlySales)} tone="slate" />
            {isAdmin ? (
              <StatCard icon={AlertTriangle} label="Stock faible" value={stats.lowStockCount} tone="amber" />
            ) : (
              <StatCard icon={Bell} label="Notifications non lues" value={dashboardState.data.unreadNotifications} tone="amber" />
            )}
          </div>

          {isAdmin && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard icon={CreditCard} label="Ventes du mois" value={formatMoney(stats.monthlySales)} tone="emerald" />
              <StatCard icon={Users} label="Clients" value={stats.totalCustomers} tone="blue" />
              <StatCard icon={Activity} label="Dettes clients" value={formatMoney(stats.outstandingDebt)} tone="rose" />
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <h2 className="font-semibold text-slate-900 dark:text-white">Dernieres ventes</h2>
                <Link className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400" to="/invoices">
                  Voir tout
                </Link>
              </div>
              <RecentSalesTable sales={recentSales} />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="font-semibold text-slate-900 dark:text-white">Montants recents</h2>
              <div className="mt-4 space-y-3">
                {recentSales.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune donnee a afficher.</p>
                ) : (
                  recentSales.slice(0, 6).map((sale) => (
                    <div key={sale._id} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>#{sale.invoiceNumber}</span>
                        <span>{formatMoney(sale.totalAmount)}</span>
                      </div>
                      <progress
                        className="h-2 w-full overflow-hidden rounded-full"
                        max={recentMax}
                        value={sale.totalAmount}
                        aria-label={`Montant facture ${sale.invoiceNumber}`}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {isAdmin && (
            <div className="grid gap-6 xl:grid-cols-2">
              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <h2 className="font-semibold text-slate-900 dark:text-white">Alertes stock faible</h2>
                </div>
                <LowStockList products={dashboardState.data.lowStockProducts ?? []} />
              </section>

              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <h2 className="font-semibold text-slate-900 dark:text-white">Activite recente</h2>
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
