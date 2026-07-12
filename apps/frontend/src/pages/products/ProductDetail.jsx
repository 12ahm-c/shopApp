import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productApi } from '../../api/product';
import useAuthStore from '../../stores/authStore';
import { Loader2, ArrowLeft, Edit, Trash2, AlertTriangle, Calendar } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    setDeleting(true);
    setDeleteError(null);
    try {
      await productApi.deleteProduct(id);
      navigate('/products');
    } catch (err) {
      setDeleteError(err?.response?.data?.error?.message || err?.message || 'Failed to delete product');
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
            className="p-2 rounded-xl hover:bg-white/5 transition-colors text-slate-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {product.name}
              </h1>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/5 text-slate-300 border border-white/5">
                {product.category}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500">ID: {product._id}</span>
            </p>
          </div>
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-3">
            <Link
              to={`/products/${product._id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-xl transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        )}
      </div>

      {deleteError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-400">
            <strong>Cannot delete product:</strong> {deleteError}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Price Card */}
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-sm font-medium text-slate-400">Unit Price</span>
          <div className="text-3xl font-bold text-white mt-2 tabular-nums">
            {product.price.toLocaleString()} <span className="text-lg font-medium text-slate-500">MRU</span>
          </div>
        </div>
        
        {/* Stock Card */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isLowStock 
            ? 'bg-amber-500/5 border-amber-500/20 relative overflow-hidden' 
            : 'bg-white/[0.03] border-white/5'
        }`}>
          {isLowStock && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full flex items-start justify-end p-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          )}
          <span className="text-sm font-medium text-slate-400">Current Stock</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-bold ${isLowStock ? 'text-amber-400' : 'text-white'}`}>
              {product.quantity}
            </span>
            <span className="text-sm font-medium text-slate-500">units</span>
          </div>
        </div>

        {/* Threshold Card */}
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-sm font-medium text-slate-400">Alert Threshold</span>
          <div className="flex items-center gap-2 mt-2">
            <AlertTriangle className="w-5 h-5 text-slate-500" />
            <span className="text-xl font-semibold text-slate-300">{product.alertThreshold}</span>
          </div>
        </div>

        {/* Created At Card */}
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-sm font-medium text-slate-400">Added On</span>
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            <span className="text-lg font-medium text-slate-300">
              {new Date(product.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
