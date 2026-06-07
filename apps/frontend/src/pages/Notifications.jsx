import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Filter, Loader2, SearchX } from 'lucide-react';
import { notificationApi } from '../api/notification';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';



const formatDateTime = (isoDate) => {
  if (!isoDate) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoDate));
};

export default function Notifications() {
  const { t } = useTranslation();
  
  const notificationTypes = useMemo(() => [
    { value: '', label: t('notification.types.all') },
    { value: 'low_stock', label: t('notification.types.low_stock') },
    { value: 'daily_summary', label: t('notification.types.daily_summary') },
    { value: 'debt_updated', label: t('notification.types.debt_updated') },
    { value: 'invoice_deleted', label: t('notification.types.invoice_deleted') }
  ], [t]);

  const typeLabels = useMemo(() => 
    Object.fromEntries(notificationTypes.map((type) => [type.value, type.label])),
  [notificationTypes]);

  const [filters, setFilters] = useState({
    unreadOnly: false,
    type: ''
  });
  const [notificationsState, setNotificationsState] = useState({
    status: 'loading',
    data: [],
    error: null,
    meta: null
  });
  const [actionState, setActionState] = useState({
    status: 'idle',
    id: null
  });

  const requestParams = useMemo(() => ({
    page: 1,
    limit: 20,
    unreadOnly: filters.unreadOnly,
    type: filters.type
  }), [filters]);

  const loadNotifications = useCallback(async () => {
    setNotificationsState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const response = await notificationApi.getNotifications(requestParams);
      if (!response.success) {
        throw new Error(response.error?.message || t('notification.error_load'));
      }
      setNotificationsState({
        status: 'success',
        data: response.data,
        error: null,
        meta: response.meta
      });
    } catch (error) {
      setNotificationsState({
        status: 'error',
        data: [],
        error: error.message || t('notification.error_load'),
        meta: null
      });
    }
  }, [requestParams, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadNotifications();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadNotifications]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotificationsState((prev) => {
        if (prev.status !== 'success') return prev;
        
        if (filters.type && notification.type !== filters.type) return prev;

        const newTotal = (prev.meta?.total || 0) + 1;
        const newUnreadCount = (prev.meta?.unreadCount || 0) + 1;

        return {
          ...prev,
          data: [notification, ...prev.data].slice(0, prev.meta?.limit || 20),
          meta: { ...prev.meta, total: newTotal, unreadCount: newUnreadCount }
        };
      });
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('stock:alert', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('stock:alert', handleNewNotification);
    };
  }, [socket, filters]);

  const handleMarkRead = async (id) => {
    setActionState({ status: 'loading', id });
    try {
      await notificationApi.markAsRead(id);
    } catch {
      // Silently fail — user can retry
    }
    setActionState({ status: 'idle', id: null });
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    setActionState({ status: 'loading', id: 'all' });
    try {
      await notificationApi.markAllAsRead();
    } catch {
      // Silently fail — user can retry
    }
    setActionState({ status: 'idle', id: null });
    loadNotifications();
  };

  const resetFilters = () => {
    setFilters({ unreadOnly: false, type: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {t('notification.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('notification.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={actionState.status === 'loading' || !notificationsState.meta?.unreadCount}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {actionState.id === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          {t('notification.mark_all_read')}
        </button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Filter className="h-4 w-4" />
            {t('notification.filters')}
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {notificationsState.meta?.unreadCount ?? 0} {t('notification.unread')}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('notification.type')}</span>
            <select
              value={filters.type}
              onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              {notificationTypes.map((type) => (
                <option key={type.value || 'all'} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
            <input
              type="checkbox"
              checked={filters.unreadOnly}
              onChange={(event) => setFilters((current) => ({ ...current, unreadOnly: event.target.checked }))}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('notification.show_unread_only')}</span>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <SearchX className="h-4 w-4" />
            {t('notification.reset')}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {notificationsState.status === 'loading' && (
          <div className="flex items-center justify-center p-10" aria-live="polite" aria-busy="true">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {notificationsState.status === 'error' && (
          <div className="p-6 text-sm text-rose-600 dark:text-rose-400">{notificationsState.error}</div>
        )}

        {notificationsState.status === 'success' && notificationsState.data.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">{t('notification.empty')}</div>
        )}

        {notificationsState.status === 'success' && notificationsState.data.length > 0 && (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {notificationsState.data.map((notification) => (
              <article key={notification._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${notification.isRead ? 'bg-slate-300 dark:bg-slate-700' : 'bg-blue-500'}`} aria-hidden="true" />
                    <h2 className="font-semibold text-slate-900 dark:text-white">{notification.title}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {typeLabels[notification.type] || notification.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{notification.body}</p>
                  <p className="mt-2 text-xs text-slate-500">{formatDateTime(notification.createdAt)}</p>
                </div>

                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notification._id)}
                    disabled={actionState.status === 'loading'}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {actionState.id === notification._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                    {t('notification.mark_read')}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
