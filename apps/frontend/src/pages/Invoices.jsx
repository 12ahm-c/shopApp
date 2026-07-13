import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Eye, Filter, Loader2, ReceiptText, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { employeeApi } from '../api/employee';
import { invoiceApi } from '../api/invoice';
import useAuthStore from '../stores/authStore';
import { formatMoney, formatDateTime } from '../lib/format';

const paymentLabels = {
  cash: 'payment.cash',
  card: 'payment.card',
  bankily: 'payment.bankily',
  alsadd: 'payment.alsadd',
  bimbank: 'payment.bimbank',
  masrafi: 'payment.masrafi'
};

const toStartOfDay = (date) => date ? `${date}T00:00:00.000Z` : '';
const toEndOfDay = (date) => date ? `${date}T23:59:59.999Z` : '';

export default function Invoices() {
  const { t } = useTranslation();
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
    error: null
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
      setInvoicesState({
        status: 'success',
        data: response.data,
        error: null
      });
    } catch (error) {
      setInvoicesState({
        status: 'error',
        data: [],
        error: error.message || t('invoice.notFound')
      });
    }
    }, [requestParams, t]);

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
          if (isActive) {
            setEmployeesState({ status: 'success', data: response.data });
          }
        })
        .catch(() => {
          if (isActive) {
            setEmployeesState({ status: 'error', data: [] });
          }
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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-text-primary">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <ReceiptText className="h-5 w-5 text-primary" />
            </div>
            {t('invoice.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground ml-12">
            {isAdmin ? t('invoice.subtitle.admin') : t('invoice.subtitle.employee')}
          </p>
        </div>
        <div className="rounded-xl border border-surface-border bg-card px-4 py-2.5 text-sm font-semibold text-text-primary tabular-nums">
          {formatMoney(totalVisible)}
        </div>
      </div>

      <section className="rounded-2xl border border-surface-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Filter className="h-4 w-4" />
          {t('invoice.filters')}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-secondary">{t('invoice.from')}</span>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-secondary">{t('invoice.to')}</span>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
            />
          </label>

          {isAdmin && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-secondary">{t('invoice.employee')}</span>
              <select
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="">{t('invoice.allEmployees')}</option>
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
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent active:scale-[0.97]"
          >
            <SearchX className="h-4 w-4" />
            {t('invoice.reset')}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-surface-border bg-card">
        {invoicesState.status === 'loading' && (
          <div className="flex items-center justify-center p-10" aria-live="polite" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {invoicesState.status === 'error' && (
          <div className="p-6 text-sm text-rose-600 dark:text-rose-400">{invoicesState.error}</div>
        )}

        {invoicesState.status === 'success' && invoicesState.data.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">{t('invoice.noInvoices')}</div>
        )}

        {invoicesState.status === 'success' && invoicesState.data.length > 0 && (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-surface-border">
              {invoicesState.data.map((invoice) => (
                <Link
                  key={invoice._id}
                  to={`/invoices/${invoice._id}`}
                  className="block px-4 py-3 hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-text-primary text-sm">#{invoice.invoiceNumber}</div>
                    <div className="font-bold text-sm text-text-primary tabular-nums">{formatMoney(invoice.totalAmount)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{invoice.customerName}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(invoice.createdAt)}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">{t('table.invoice')}</th>
                    <th className="px-6 py-4 font-medium">{t('table.client')}</th>
                    <th className="px-6 py-4 font-medium">{t('table.employee')}</th>
                    <th className="px-6 py-4 font-medium">{t('table.payment')}</th>
                    <th className="px-6 py-4 text-right font-medium">{t('table.total')}</th>
                    <th className="px-6 py-4 text-right font-medium">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {invoicesState.data.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-accent">
                      <td className="px-6 py-4 min-w-[130px]">
                        <div className="font-semibold text-text-primary text-base">#{invoice.invoiceNumber}</div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{formatDateTime(invoice.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{invoice.customerName}</td>
                      <td className="px-6 py-4 text-text-secondary">{invoice.employeeName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{t(paymentLabels[invoice.paymentMethod] || invoice.paymentMethod)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-text-primary text-base whitespace-nowrap tabular-nums">{formatMoney(invoice.totalAmount)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/invoices/${invoice._id}`}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          aria-label={t('invoice.view', { number: invoice.invoiceNumber })}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
