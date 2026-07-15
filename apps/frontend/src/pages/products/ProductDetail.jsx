import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../api/product';
import useAuthStore from '../../stores/authStore';
import { Loader2, ArrowLeft, Edit, Trash2, AlertTriangle, Calendar } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const role = useAuthStore(state => state.role);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    let isActive = true;
    productApi.getProductById(id)
      .then(res => {
        if (isActive) {
          setProduct(res.data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        navigate('/products');
      });
    return () => { isActive = false; };
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm(t('productPage.deleteConfirm'))) {
      return;
    }
    
    setDeleting(true);
    setDeleteError(null);
    try {
      await productApi.deleteProduct(id);
      navigate('/products');
    } catch (err) {
      setDeleteError(err?.response?.data?.error?.message || err?.message || t('productPage.deleteFailed'));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!product) return null;

  const isLowStock = product.quantity <= product.alertThreshold;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/products')}
            className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                {product.name}
              </h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-accent text-text-secondary border border-surface-border">
                {product.category}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">ID: {product._id}</span>
            </p>
          </div>
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-3">
            <Link
              to={`/products/${product._id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent border border-surface-border hover:bg-surface-hover text-text-secondary text-sm font-medium rounded-xl transition-all"
            >
              <Edit className="w-4 h-4" />
              {t('productPage.edit')}
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {t('productPage.delete')}
            </button>
          </div>
        )}
      </div>

      {deleteError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-600 dark:text-rose-400">
            <strong>{t('productPage.delete')}:</strong> {deleteError}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Price Card */}
        <div className="bg-card p-5 rounded-2xl border border-surface-border flex flex-col justify-between">
          <span className="text-sm font-medium text-muted-foreground">{t('productPage.unitPrice')}</span>
          <div className="text-3xl font-bold text-text-primary mt-2 tabular-nums">
            {product.price.toLocaleString()} <span className="text-lg font-medium text-muted-foreground">MRU</span>
          </div>
        </div>
        
        {/* Stock Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isLowStock 
            ? 'bg-amber-500/5 border-amber-500/20 relative overflow-hidden' 
            : 'bg-card border-surface-border'
        }`}>
          {isLowStock && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full flex items-start justify-end p-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          )}
          <span className="text-sm font-medium text-muted-foreground">{t('productPage.currentStock')}</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-bold ${isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-text-primary'}`}>
              {product.quantity}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{t('productPage.units')}</span>
          </div>
        </div>

        {/* Threshold Card */}
        <div className="bg-card p-5 rounded-2xl border border-surface-border flex flex-col justify-between">
          <span className="text-sm font-medium text-muted-foreground">{t('productPage.alertThreshold')}</span>
          <div className="flex items-center gap-2 mt-2">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            <span className="text-xl font-semibold text-text-secondary">{product.alertThreshold}</span>
          </div>
        </div>

        {/* Created At Card */}
        <div className="bg-card p-5 rounded-2xl border border-surface-border flex flex-col justify-between">
          <span className="text-sm font-medium text-muted-foreground">{t('productPage.addedOn')}</span>
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="text-lg font-medium text-text-secondary">
              {new Date(product.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
