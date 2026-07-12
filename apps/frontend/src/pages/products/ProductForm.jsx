import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi } from '../../api/product';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    alertThreshold: 5
  });

  useEffect(() => {
    if (isEdit) {
      let isActive = true;
      productApi.getProductById(id)
        .then(res => {
          if (isActive) {
            setFormData({
              name: res.data.name,
              category: res.data.category,
              price: res.data.price,
              quantity: res.data.quantity,
              alertThreshold: res.data.alertThreshold
            });
            setLoading(false);
          }
        })
        .catch(err => {
          console.error(err);
          navigate('/products');
        });
      return () => { isActive = false; };
    }
  }, [id, navigate, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        price: parseInt(formData.price, 10),
        quantity: parseInt(formData.quantity, 10),
        alertThreshold: parseInt(formData.alertThreshold, 10)
      };

      if (isEdit) {
        await productApi.updateProduct(id, payload);
      } else {
        await productApi.createProduct(payload);
      }
      navigate('/products');
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to save product');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/products')}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isEdit ? 'Update the product details below.' : 'Fill out the details to create a new product.'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Name *</span>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required
                minLength={2}
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-green-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Category *</span>
              <input 
                type="text" 
                name="category" 
                list="categories"
                value={formData.category} 
                onChange={handleChange} 
                required
                minLength={2}
                maxLength={50}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-green-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              />
              <datalist id="categories">
                <option value="Épicerie" />
                <option value="Électronique" />
                <option value="Vêtements" />
                <option value="Autre" />
              </datalist>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Price (MRU) *</span>
              <input 
                type="number" 
                name="price" 
                min="1"
                value={formData.price} 
                onChange={handleChange} 
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-green-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Initial Quantity *</span>
              <input 
                type="number" 
                name="quantity" 
                min="0"
                value={formData.quantity} 
                onChange={handleChange} 
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-green-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Low Stock Alert Threshold</span>
              <input 
                type="number" 
                name="alertThreshold" 
                min="0"
                value={formData.alertThreshold} 
                onChange={handleChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-green-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              />
            </label>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm shadow-green-500/20 font-medium transition-all disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
