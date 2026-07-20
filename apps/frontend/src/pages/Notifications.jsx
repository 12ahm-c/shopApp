import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Filter, Loader2, SearchX, BellRing } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { notificationApi } from '../api/notification';
import { formatDateTime } from '../lib/format';
import { requestNotificationPermission } from '../lib/firebase';

export default function Notifications() {
  const { t } = useTranslation();
  const [pushPermission, setPushPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });
  const [pushLoading, setPushLoading] = useState(false);
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

  const notificationTypes = useMemo(() => [
    { value: '', label: t('notification.allTypes') },
    { value: 'low_stock', label: t('notification.lowStock') },
    { value: 'daily_summary', label: t('notification.dailySummary') },
    { value: 'debt_updated', label: t('notification.debtUpdated') },
    { value: 'invoice_deleted', label: t('notification.invoiceDeleted') }
  ], [t]);

  const typeLabels = useMemo(() =>
    Object.fromEntries(notificationTypes.map((type) => [type.value, type.label])),
    [notificationTypes]
  );

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
        throw new Error(response.error?.message || t('notification.loadError'));
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
        error: error.message || t('notification.loadError'),
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

  const handleMarkRead = async (id) => {
    setActionState({ status: 'loading', id });
    try {
      await notificationApi.markAsRead(id);
      setNotificationsState((current) => ({
        ...current,
        data: current.data.filter((n) => n._id !== id),
        meta: current.meta ? { ...current.meta, unreadCount: Math.max(0, current.meta.unreadCount - 1) } : current.meta
      }));
    } catch {
      // silently fail
    } finally {
      setActionState({ status: 'idle', id: null });
    }
  };

  const handleMarkAllRead = async () => {
    setActionState({ status: 'loading', id: 'all' });
    try {
      await notificationApi.markAllAsRead();
      setNotificationsState((current) => ({
        ...current,
        data: [],
        meta: current.meta ? { ...current.meta, unreadCount: 0 } : current.meta
      }));
    } catch {
      // silently fail
    } finally {
      setActionState({ status: 'idle', id: null });
    }
  };

  const handleFilterChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetFilters = () => {
    setFilters({ unreadOnly: false, type: '' });
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      const result = await requestNotificationPermission();
      if (result) {
        setPushPermission('granted');
      }
    } catch {
      setPushPermission('denied');
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {pushPermission !== 'granted' && 'Notification' in window && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <BellRing className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">
                {t('notification.pushEnableTitle')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('notification.pushEnableDescription')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {pushLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
              {t('notification.pushEnableButton')}
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-text-primary">
            <Bell className="h-6 w-6 text-blue-400" />
            {t('notification.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {notificationsState.meta?.unreadCount != null
              ? `${notificationsState.meta.unreadCount} ${t('notification.unreadOnly').toLowerCase()}`
              : ''}
          </p>
        </div>
        {notificationsState.data.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={actionState.status === 'loading'}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
          >
            {actionState.status === 'loading' && actionState.id === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            {t('notification.markAllRead')}
          </button>
        )}
      </div>

      <section className="rounded-2xl border border-surface-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Filter className="h-4 w-4" />
          {t('notification.filters')}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <input
              type="checkbox"
              name="unreadOnly"
              checked={filters.unreadOnly}
              onChange={handleFilterChange}
              className="h-4 w-4 rounded text-blue-500 focus:ring-blue-500/30"
            />
            {t('notification.unreadOnly')}
          </label>
          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
          >
            {notificationTypes.map((type) => (
              <option key={type.value || 'all'} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            <SearchX className="h-4 w-4" />
            {t('activityLog.reset')}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        {notificationsState.status === 'loading' && (
          <div className="flex items-center justify-center rounded-2xl border border-surface-border bg-card p-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {notificationsState.status === 'error' && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
            {notificationsState.error}
          </div>
        )}

        {notificationsState.status === 'success' && notificationsState.data.length === 0 && (
          <div className="rounded-2xl border border-surface-border bg-card p-12 text-center text-sm text-muted-foreground">
            {t('notification.noNotifications')}
          </div>
        )}

        {notificationsState.status === 'success' &&
          notificationsState.data.map((notification) => (
            <div
              key={notification._id}
              className="flex items-start gap-4 rounded-2xl border border-surface-border bg-card p-4 transition-all hover:bg-surface-hover"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{notification.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-surface px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {typeLabels[notification.type] || notification.type}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(notification.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleMarkRead(notification._id)}
                disabled={actionState.status === 'loading'}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-400 disabled:opacity-50"
                aria-label="Marquer comme lu"
              >
                {actionState.status === 'loading' && actionState.id === notification._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
      </section>
    </div>
  );
}
