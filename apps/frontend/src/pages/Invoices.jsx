import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Eye, Filter, Loader2, ReceiptText, SearchX } from 'lucide-react';
import { employeeApi } from '../api/employee';
import { invoiceApi } from '../api/invoice';
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

const toStartOfDay = (date) => date ? `${date}T00:00:00.000Z` : '';
const toEndOfDay = (date) => date ? `${date}T23:59:59.999Z` : '';

export default function Invoices() {
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === 'admin';
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    employeeId: ''
  });
  const [invoicesState, setInvoicesState] = useState({
    status: 'loading',
    data: [],
    error: null,
    meta: null
  });
  const [employeesState, setEmployeesState] = useState({
    status: 'idle',
    data: []
  });

  const requestParams = useMemo(() => ({
    page: 1,
    limit: 20,
    from: toStartOfDay(filters.from),
    to: toEndOfDay(filters.to),
    employeeId: isAdmin ? filters.employeeId : ''
  }), [filters, isAdmin]);

  const loadInvoices = useCallback(async () => {
    setInvoicesState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const response = await invoiceApi.getInvoices(requestParams);
      if (!response.success) {
        throw new Error(response.error?.message || 'Impossible de charger les factures.');
      }
      setInvoicesState({
        status: 'success',
        data: response.data,
        error: null,
        meta: response.meta
      });
    } catch (error) {
      setInvoicesState({
        status: 'error',
        data: [],
        error: error.message || 'Impossible de charger les factures.',
        meta: null
      });
    }
  }, [requestParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadInvoices();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadInvoices]);

  useEffect(() => {
    if (!isAdmin || employeesState.status !== 'idle') return;

    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      setEmployeesState({ status: 'loading', data: [] });
      employeeApi.getEmployees({ page: 1, limit: 100 })
        .then((response) => {
          if (isActive) setEmployeesState({ status: 'success', data: response.data });
        })
        .catch(() => {
          if (isActive) setEmployeesState({ status: 'error', data: [] });
        });
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [employeesState.status, isAdmin]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ from: '', to: '', employeeId: '' });
  };

  const totalVisible = invoicesState.data.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <ReceiptText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Factures
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin ? 'Toutes les ventes du magasin.' : 'Vos factures personnelles.'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {formatMoney(totalVisible)}
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Filter className="h-4 w-4" />
          Filtres
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Depuis</span>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Jusqu'au</span>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>

          {isAdmin && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Employe</span>
              <select
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Tous les employes</option>
                {employeesState.data.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <SearchX className="h-4 w-4" />
            Reinitialiser
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {invoicesState.status === 'loading' && (
          <div className="flex items-center justify-center p-10" aria-live="polite" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {invoicesState.status === 'error' && (
          <div className="p-6 text-sm text-rose-600 dark:text-rose-400">{invoicesState.error}</div>
        )}

        {invoicesState.status === 'success' && invoicesState.data.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">Aucune facture trouvee.</div>
        )}

        {invoicesState.status === 'success' && invoicesState.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Facture</th>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Employe</th>
                  <th className="px-6 py-4 font-medium">Paiement</th>
                  <th className="px-6 py-4 text-right font-medium">Total</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {invoicesState.data.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">#{invoice.invoiceNumber}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDateTime(invoice.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{invoice.customerName}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{invoice.employeeName}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{paymentLabels[invoice.paymentMethod] || invoice.paymentMethod}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">{formatMoney(invoice.totalAmount)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/invoices/${invoice._id}`}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        aria-label={`Voir facture ${invoice.invoiceNumber}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
