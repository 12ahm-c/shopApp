import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Banknote, Loader2, ReceiptText, Trash2 } from 'lucide-react';
import { invoiceApi } from '../api/invoice';
import { saleApi } from '../api/sale';
import useAuthStore from '../stores/authStore';

const currencyFormatter = new Intl.NumberFormat('fr-FR');

const formatMoney = (amount) => `${currencyFormatter.format(Number(amount || 0))} MRU`;

const formatDateTime = (isoDate) => {
  if (!isoDate) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(new Date(isoDate));
};

const paymentLabels = {
  cash: 'Especes',
  card: 'Carte',
  bankily: 'Bankily'
};

export default function InvoiceDetail() {
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
        throw new Error(response.error?.message || 'Facture introuvable.');
      }
      setInvoiceState({ status: 'success', data: response.data, error: null });
    } catch (error) {
      setInvoiceState({
        status: 'error',
        data: null,
        error: error.message || 'Facture introuvable.'
      });
    }
  }, [id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadInvoice();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadInvoice]);

  const handleCancelInvoice = async () => {
    if (!window.confirm('Annuler cette facture ? Le backend restaurera le stock selon le contrat.')) {
      return;
    }

    setCancelState({ status: 'loading', error: null });
    try {
      const response = await saleApi.deleteSale(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Impossible d annuler la facture.');
      }
      navigate('/invoices');
    } catch (error) {
      setCancelState({
        status: 'error',
        error: error.message || 'Impossible d annuler la facture.'
      });
    }
  };

  if (invoiceState.status === 'loading') {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
      </div>
    );
  }

  if (invoiceState.status === 'error') {
    return (
      <div className="space-y-4">
        <Link to="/invoices" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300">
          <ArrowLeft className="h-4 w-4" />
          Retour aux factures
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
              <ReceiptText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Facture #{invoice.invoiceNumber}
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
            Annuler
          </button>
        )}
      </div>

      {cancelState.status === 'error' && (
        <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {cancelState.error}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Client</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{invoice.customerName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Employe</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{invoice.employeeName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Mode de paiement</p>
            <p className="mt-1 inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Banknote className="h-4 w-4 text-emerald-600" />
              {paymentLabels[invoice.paymentMethod] || invoice.paymentMethod}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">Produits vendus</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Produit</th>
                <th className="px-6 py-4 text-right font-medium">Quantite</th>
                <th className="px-6 py-4 text-right font-medium">Prix unitaire</th>
                <th className="px-6 py-4 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {invoice.items.map((item) => (
                <tr key={`${item.productId}-${item.name}`} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                  <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">{formatMoney(item.unitPrice)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-950/50">
              <tr>
                <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white" colSpan="3">Total general</td>
                <td className="px-6 py-4 text-right text-lg font-bold text-slate-900 dark:text-white">{formatMoney(invoice.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
