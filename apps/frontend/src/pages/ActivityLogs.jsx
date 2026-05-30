import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Filter, Loader2, SearchX } from 'lucide-react';
import { activityLogApi } from '../api/activityLog';
import { employeeApi } from '../api/employee';
import useAuthStore from '../stores/authStore';

const logActions = [
  { value: '', label: 'Toutes les actions' },
  { value: 'sale', label: 'Vente' },
  { value: 'delete_invoice', label: 'Suppression facture' },
  { value: 'login', label: 'Connexion' },
  { value: 'logout', label: 'Deconnexion' }
];

const formatDateTime = (isoDate) => {
  if (!isoDate) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoDate));
};

const toStartOfDay = (date) => date ? `${date}T00:00:00.000Z` : '';
const toEndOfDay = (date) => date ? `${date}T23:59:59.999Z` : '';

export default function ActivityLogs() {
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

  const requestParams = useMemo(() => ({
    page: 1,
    limit: 20,
    action: filters.action,
    from: toStartOfDay(filters.from),
    to: toEndOfDay(filters.to),
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
        error: error.message || 'Impossible de charger le journal.',
        meta: null
      });
    }
  }, [requestParams]);

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
            Journal d'activite
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? 'Vue complete des actions utilisateurs.'
              : `Vos actions uniquement, ${currentUser?.name ?? 'utilisateur'}.`}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <Activity className="h-4 w-4" />
          {logsState.meta?.total ?? logsState.data.length} evenements
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Filter className="h-4 w-4" />
          Filtres
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Action</span>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {logActions.map((action) => (
                <option key={action.value || 'all'} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Depuis</span>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Jusqu'au</span>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </label>

          {isAdmin && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Utilisateur</span>
              <select
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Tous les utilisateurs</option>
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
            Reinitialiser
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {logsState.status === 'loading' && (
          <div className="flex items-center justify-center p-10" aria-live="polite" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {logsState.status === 'error' && (
          <div className="p-6 text-sm text-rose-600 dark:text-rose-400">
            {logsState.error}
          </div>
        )}

        {logsState.status === 'success' && logsState.data.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            Aucun evenement trouve.
          </div>
        )}

        {logsState.status === 'success' && logsState.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 font-medium text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Utilisateur</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                  <th className="px-6 py-4 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {logsState.data.map((log) => (
                  <tr key={log._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatDateTime(log.timestamp)}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{log.userName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                      {log.amount == null ? '-' : `${Number(log.amount).toLocaleString()} MRU`}
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
