import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../api/product';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
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
              price: res.data.price,
              costPrice: res.data.costPrice ?? 0,
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
        category: "Général",
        price: parseInt(formData.price, 10),
        costPrice: parseInt(formData.costPrice, 10) || 0,
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
      setError(err?.response?.data?.error?.message || err?.message || t('productPage.saveFailed'));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/products')}
          className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {isEdit ? t('productPage.editProduct') : t('productPage.addNewProduct')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? t('productPage.editSubtitle') : t('productPage.addSubtitle')}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-surface-border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-text-secondary">{t('productPage.name')} *</span>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required
                minLength={2}
                maxLength={100}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-secondary">{t('productPage.price')} *</span>
              <input 
                type="number" 
                name="price" 
                min="1"
                value={formData.price} 
                onChange={handleChange} 
                required
                className="!tabular-nums"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-secondary">{t('productPage.costPrice')}</span>
              <input 
                type="number" 
                name="costPrice" 
                min="0"
                value={formData.costPrice} 
                onChange={handleChange} 
                className="!tabular-nums"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-secondary">{t('productPage.initialQuantity')} *</span>
              <input 
                type="number" 
                name="quantity" 
                min="0"
                value={formData.quantity} 
                onChange={handleChange} 
                required
                className="!tabular-nums"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-secondary">{t('productPage.lowStockThreshold')}</span>
              <input 
                type="number" 
                name="alertThreshold" 
                min="0"
                value={formData.alertThreshold} 
                onChange={handleChange} 
                className="!tabular-nums"
              />
            </label>
          </div>

          {error && (
            <div className="p-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end pt-4 border-t border-surface-border">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl shadow-lg shadow-blue-500/25 font-semibold transition-all disabled:opacity-70 active:scale-[0.98]"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isEdit ? t('productPage.updateProduct') : t('productPage.createProduct')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
