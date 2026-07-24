import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { invoiceApi } from '../api/invoice';
import Receipt from '../components/Receipt';

export default function PublicInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    invoiceApi.getPublicInvoiceById(id)
      .then((res) => {
        if (!cancelled && res.success) {
          setInvoice(res.data);
        } else if (!cancelled) {
          setError(res.error?.message || 'Invoice not found');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Invoice not found');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للتطبيق
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto mb-4 flex items-center justify-between no-print">
        <Link
          to="/pos"
          className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للتطبيق
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
        >
          <Printer className="w-4 h-4" />
          طباعة
        </button>
      </div>
      <Receipt data={invoice} showActions={false} />
    </div>
  );
}
