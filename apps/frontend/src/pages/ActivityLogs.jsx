import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Filter, Loader2, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { activityLogApi } from '../api/activityLog';
import { employeeApi } from '../api/employee';
import useAuthStore from '../stores/authStore';
import { formatDateTime, formatNumber } from '../lib/format';

export default function ActivityLogs() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === 'admin';
  const [filters, setFilters] = useState({
    action: '',
    from: '',
    to: '',
    userId: ''
  });
  const [logsState, setLogsState] = useState({
    status: 'loading',
    data: [],
    error: null,
    meta: null
  });
  const [employeesState, setEmployeesState] = useState({
    status: 'idle',
    data: []
  });

  const logActions = useMemo(() => [
    { value: '', label: t('activityLog.allActions') },
    { value: 'sale', label: t('logAction.sale') },
    { value: 'delete_invoice', label: t('logAction.deleteInvoice') },
    { value: 'login', label: t('logAction.login') },
    { value: 'logout', label: t('logAction.logout') }
  ], [t]);

  const requestParams = useMemo(() => ({
    page: 1,
    limit: 20,
    action: filters.action,
    from: filters.from ? `${filters.from}T00:00:00.000Z` : '',
    to: filters.to ? `${filters.to}T23:59:59.999Z` : '',
    userId: isAdmin ? filters.userId : ''
  }), [filters, isAdmin]);

  const loadLogs = useCallback(async () => {
    setLogsState((current) => ({ ...current, status: 'loading', error: null }));

    try {
      const response = await activityLogApi.getActivityLogs(requestParams);
      setLogsState({
        status: 'success',
        data: response.data,
        error: null,
        meta: response.meta
      });
    } catch (error) {
      setLogsState({
        status: 'error',
        data: [],
        error: error.message || t('activityLog.loadError'),
        meta: null
      });
    }
  }, [requestParams, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadLogs();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadLogs]);

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
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      action: '',
      from: '',
      to: '',
      userId: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {t('activityLog.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? t('activityLog.subtitle.admin')
              : t('activityLog.subtitle.employee', { name: currentUser?.name ?? t('employees') })}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-text-secondary">
          <Activity className="h-4 w-4" />
          {logsState.meta?.total ?? logsState.data.length} {t('activityLog.events')}
        </div>
      </div>

      <section className="rounded-2xl border border-surface-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Filter className="h-4 w-4" />
          {t('activityLog.filters')}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-secondary">{t('activityLog.action')}</span>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {logActions.map((action) => (
                <option key={action.value || 'all'} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-secondary">{t('activityLog.from')}</span>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-secondary">{t('activityLog.to')}</span>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          {isAdmin && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-secondary">{t('activityLog.user')}</span>
              <select
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">{t('activityLog.allUsers')}</option>
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
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            <SearchX className="h-4 w-4" />
            {t('activityLog.reset')}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-surface-border bg-card">
        {logsState.status === 'loading' && (
          <div className="flex items-center justify-center p-10" aria-live="polite" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {logsState.status === 'error' && (
          <div className="p-6 text-sm text-rose-400">
            {logsState.error}
          </div>
        )}

        {logsState.status === 'success' && logsState.data.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t('activityLog.noEvents')}
          </div>
        )}

        {logsState.status === 'success' && logsState.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="px-3 sm:px-6 py-4 font-medium">{t('table.date')}</th>
                  <th className="px-3 sm:px-6 py-4 font-medium hidden sm:table-cell">{t('table.user')}</th>
                  <th className="px-3 sm:px-6 py-4 font-medium">{t('table.action')}</th>
                  <th className="px-3 sm:px-6 py-4 font-medium hidden md:table-cell">{t('table.details')}</th>
                  <th className="px-3 sm:px-6 py-4 text-right font-medium">{t('table.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {logsState.data.map((log) => (
                  <tr key={log._id} className="transition-colors hover:bg-accent">
                    <td className="px-3 sm:px-6 py-4 text-muted-foreground text-sm whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="px-3 sm:px-6 py-4 font-medium text-text-primary hidden sm:table-cell">{log.userName}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-lg bg-surface px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{log.details}</td>
                    <td className="px-3 sm:px-6 py-4 text-right font-medium text-text-primary whitespace-nowrap tabular-nums">
                      {log.amount == null ? '-' : `${formatNumber(log.amount)} MRU`}
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
