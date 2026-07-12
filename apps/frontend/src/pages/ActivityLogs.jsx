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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('activityLog.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? t('activityLog.subtitle.admin')
              : t('activityLog.subtitle.employee', { name: currentUser?.name ?? t('employees') })}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <Activity className="h-4 w-4" />
          {logsState.meta?.total ?? logsState.data.length} {t('activityLog.events')}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Filter className="h-4 w-4" />
          {t('activityLog.filters')}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('activityLog.action')}</span>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-green-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {logActions.map((action) => (
                <option key={action.value || 'all'} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('activityLog.from')}</span>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-green-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('activityLog.to')}</span>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-green-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>

          {isAdmin && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('activityLog.user')}</span>
              <select
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-green-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
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
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <SearchX className="h-4 w-4" />
            {t('activityLog.reset')}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {logsState.status === 'loading' && (
          <div className="flex items-center justify-center p-10" aria-live="polite" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-green-500" />
          </div>
        )}

        {logsState.status === 'error' && (
          <div className="p-6 text-sm text-rose-600 dark:text-rose-400">
            {logsState.error}
          </div>
        )}

        {logsState.status === 'success' && logsState.data.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            {t('activityLog.noEvents')}
          </div>
        )}

        {logsState.status === 'success' && logsState.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 font-medium text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-3 sm:px-6 py-4 font-medium">{t('table.date')}</th>
                  <th className="px-3 sm:px-6 py-4 font-medium hidden sm:table-cell">{t('table.user')}</th>
                  <th className="px-3 sm:px-6 py-4 font-medium">{t('table.action')}</th>
                  <th className="px-3 sm:px-6 py-4 font-medium hidden md:table-cell">{t('table.details')}</th>
                  <th className="px-3 sm:px-6 py-4 text-right font-medium">{t('table.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {logsState.data.map((log) => (
                  <tr key={log._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-3 sm:px-6 py-4 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="px-3 sm:px-6 py-4 font-medium text-slate-900 dark:text-white hidden sm:table-cell">{log.userName}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-slate-600 dark:text-slate-300 hidden md:table-cell max-w-[200px] truncate">{log.details}</td>
                    <td className="px-3 sm:px-6 py-4 text-right font-medium text-slate-900 dark:text-white whitespace-nowrap">
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
