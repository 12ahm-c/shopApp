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
      navigate('/invoices');
    } catch (error) {
      setCancelState({
        status: 'error',
        error: error.message || t('invoice.cancelError')
      });
    }
  };

  if (invoiceState.status === 'loading') {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="h-7 w-7 animate-spin text-green-500" />
      </div>
    );
  }

  if (invoiceState.status === 'error') {
    return (
      <div className="space-y-4">
        <Link to="/invoices" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-green-600 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" />
          {t('invoice.backTo')}
        </Link>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
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
          <Link to="/invoices" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              <ReceiptText className="h-6 w-6 text-green-600 dark:text-green-400" />
              {t('invoice.invoiceNumber', { number: invoice.invoiceNumber })}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{formatDateTime(invoice.createdAt)}</p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleCancelInvoice}
            disabled={cancelState.status === 'loading'}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-70 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
          >
            {cancelState.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {t('invoice.cancel')}
          </button>
        )}
      </div>

      {cancelState.status === 'error' && (
        <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {cancelState.error}
        </div>
      )}

      <Receipt data={invoice} />
    </div>
  );
}
