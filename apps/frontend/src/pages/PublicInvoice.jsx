import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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
        <div className="text-center text-muted-foreground">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background p-4 sm:p-6">
      <Receipt data={invoice} showActions={false} />
    </div>
  );
}
