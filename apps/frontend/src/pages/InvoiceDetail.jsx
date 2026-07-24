import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2, ReceiptText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { invoiceApi } from '../api/invoice';
import { saleApi } from '../api/sale';
import useAuthStore from '../stores/authStore';
import { formatDateTime } from '../lib/format';
import Receipt from '../components/Receipt';

export default function InvoiceDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === 'admin';
  const [invoiceState, setInvoiceState] = useState({
    status: 'loading',
    data: null,
    error: null
  });
  const [cancelState, setCancelState] = useState({
    status: 'idle',
    error: null
  });

  const loadInvoice = useCallback(async () => {
    setInvoiceState({ status: 'loading', data: null, error: null });
    try {
      const response = await invoiceApi.getInvoiceById(id);
      if (!response.success) {
        throw new Error(response.error?.message || t('invoice.notFound'));
      }
      setInvoiceState({ status: 'success', data: response.data, error: null });
    } catch (error) {
      setInvoiceState({
        status: 'error',
        data: null,
        error: error.message || t('invoice.notFound')
      });
    }
    }, [id, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadInvoice();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadInvoice]);

  const handleCancelInvoice = async () => {
    if (!window.confirm(t('invoice.cancelConfirm'))) {
      return;
    }

    setCancelState({ status: 'loading', error: null });
    try {
      const response = await saleApi.deleteSale(id);
      if (!response.success) {
        throw new Error(response.error?.message || t('invoice.cancelError'));
      }
      navigate('/pos');
    } catch (error) {
      setCancelState({
        status: 'error',
        error: error.message || t('invoice.cancelError')
      });
    }
  };

  if (invoiceState.status === 'loading') {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-surface-border bg-card p-12">
        <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
      </div>
    );
  }

  if (invoiceState.status === 'error') {
    return (
      <div className="space-y-4">
        <Link to="/pos" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          {t('invoice.backTo')}
        </Link>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
          {invoiceState.error}
        </div>
      </div>
    );
  }

  const invoice = invoiceState.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/pos" className="rounded-xl p-2 text-muted-foreground hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-text-primary">
              <ReceiptText className="h-6 w-6 text-primary" />
              {t('invoice.invoiceNumber', { number: invoice.invoiceNumber })}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(invoice.createdAt)}</p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleCancelInvoice}
            disabled={cancelState.status === 'loading'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-70"
          >
            {cancelState.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {t('invoice.cancel')}
          </button>
        )}
      </div>

      {cancelState.status === 'error' && (
        <div className="flex gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {cancelState.error}
        </div>
      )}

      <Receipt data={invoice} />
    </div>
  );
}
