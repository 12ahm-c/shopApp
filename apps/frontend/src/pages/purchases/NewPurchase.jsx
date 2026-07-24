import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, Plus, X, Search, Package, Store } from 'lucide-react';
import { purchaseApi } from '../../api/purchase';
import { productApi } from '../../api/product';
import { supplierApi } from '../../api/supplier';
import { formatMoney } from '../../lib/format';

export default function NewPurchase() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  const [items, setItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await supplierApi.getSuppliers({ limit: 100 });
        if (!cancelled && mountedRef.current) setSuppliers(res.data || []);
      } catch {
        // silent
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    (s.phone && s.phone.includes(supplierSearch))
  );

  useEffect(() => {
    if (!productSearch || productSearch.length < 1) return;
    let cancelled = false;
    let timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await productApi.getProducts({ search: productSearch, limit: 20 });
        if (!cancelled && mountedRef.current) setProductResults(res.data || []);
      } catch {
        if (!cancelled && mountedRef.current) setProductResults([]);
      } finally {
        if (!cancelled && mountedRef.current) setSearchingProducts(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [productSearch]);

  const addProduct = (product) => {
    const exists = items.find((item) => item.productId === product._id);
    if (exists) {
      setItems(items.map((item) =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setItems([...items, {
        productId: product._id,
        name: product.name,
        quantity: 1,
        unitPrice: product.costPrice || product.price || 0
      }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const addNewProduct = () => {
    if (!productSearch.trim()) return;
    setItems([...items, {
      productId: null,
      name: productSearch.trim(),
      quantity: 1,
      unitPrice: 0
    }]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const updateItem = (index, field, value) => {
    setItems(items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const createNewSupplier = async () => {
    if (!newSupplierName.trim()) return;
    setCreatingSupplier(true);
    try {
      const res = await supplierApi.createSupplier({
        name: newSupplierName.trim(),
        phone: newSupplierPhone.trim() || undefined
      });
      if (mountedRef.current) {
        const newSupplier = res.data;
        setSuppliers((prev) => [...prev, newSupplier]);
        setSelectedSupplier(newSupplier);
        setSupplierSearch(newSupplier.name);
        setShowNewSupplierForm(false);
        setNewSupplierName('');
        setNewSupplierPhone('');
      }
    } catch {
      // silent
    } finally {
      if (mountedRef.current) setCreatingSupplier(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      setError(t('purchasesPage.selectSupplier'));
      return;
    }
    if (items.length === 0) {
      setError(t('purchasesPage.emptyItems'));
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await purchaseApi.createPurchase({
        supplierId: selectedSupplier._id,
        items: items.map((item) => ({
          productId: item.productId || undefined,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        notes: notes.trim()
      });
      setSuccess(true);
      setTimeout(() => navigate('/purchases'), 1000);
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.message || 'Failed to save purchase');
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          {t('purchasesPage.purchaseRecord')}
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/20">
          {t('purchasesPage.createSuccess')}
        </div>
      )}

      <div className="bg-card border border-surface-border rounded-2xl p-5 space-y-5">
        {/* Supplier */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <Store className="w-4 h-4" />
            {t('purchasesPage.supplier')} *
          </label>
          <div className="relative">
            <input
              type="text"
              value={supplierSearch}
              onChange={(e) => {
                setSupplierSearch(e.target.value);
                setShowSupplierDropdown(true);
                if (!e.target.value) setSelectedSupplier(null);
              }}
              onFocus={() => setShowSupplierDropdown(true)}
              onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
              placeholder={t('purchasesPage.selectSupplier')}
              className="w-full text-sm"
            />
            {showSupplierDropdown && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-surface-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredSuppliers.length === 0 && !showNewSupplierForm && (
                  <div className="px-4 py-3 text-xs text-muted-foreground">
                    {t('purchasesPage.noResults')}
                  </div>
                )}
                {filteredSuppliers.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    className="w-full text-right px-4 py-2.5 hover:bg-secondary/50 transition-colors text-sm"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedSupplier(s);
                      setSupplierSearch(s.name);
                      setShowSupplierDropdown(false);
                    }}
                  >
                    <div className="font-medium text-text-primary">{s.name}</div>
                    {s.phone && <div className="text-xs text-muted-foreground">{s.phone}</div>}
                  </button>
                ))}
                <button
                  type="button"
                  className="w-full text-right px-4 py-2.5 hover:bg-primary/10 text-primary text-sm font-medium border-t border-surface-border flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowNewSupplierForm(true);
                    setShowSupplierDropdown(false);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  {t('purchasesPage.addSupplier')}
                </button>
              </div>
            )}
          </div>
        </div>

        {showNewSupplierForm && (
          <div className="p-4 bg-secondary/30 rounded-xl border border-surface-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">{t('purchasesPage.newSupplier')}</h3>
              <button onClick={() => setShowNewSupplierForm(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              placeholder={t('purchasesPage.supplierName')}
              className="w-full text-sm"
            />
            <input
              type="tel"
              value={newSupplierPhone}
              onChange={(e) => setNewSupplierPhone(e.target.value)}
              placeholder={t('purchasesPage.supplierPhone')}
              className="w-full text-sm"
            />
            <button
              onClick={createNewSupplier}
              disabled={!newSupplierName.trim() || creatingSupplier}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creatingSupplier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('purchasesPage.addSupplier')}
            </button>
          </div>
        )}

        {/* Products */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <Package className="w-4 h-4" />
            {t('purchasesPage.items')}
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
              placeholder={t('purchasesPage.searchProducts')}
              className="!pl-10 w-full text-sm"
            />
            {showProductDropdown && productSearch && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-surface-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {searchingProducts ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {productResults.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        className="w-full text-right px-4 py-2.5 hover:bg-secondary/50 transition-colors text-sm"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addProduct(p);
                        }}
                      >
                        <div className="font-medium text-text-primary">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatMoney(p.costPrice || p.price)} MRU | {t('purchasesPage.stock')}: {p.quantity}
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="w-full text-right px-4 py-2.5 hover:bg-primary/10 text-primary text-sm font-medium border-t border-surface-border flex items-center gap-2"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addNewProduct();
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      {t('purchasesPage.addItem')}: &quot;{productSearch}&quot;
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-2 mt-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-secondary/30 rounded-xl border border-surface-border/50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{item.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 text-center text-xs py-1.5"
                    />
                    <span className="text-xs text-muted-foreground">x</span>
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseInt(e.target.value) || 0)}
                      className="w-20 text-center text-xs py-1.5"
                    />
                    <span className="text-xs text-muted-foreground">MRU</span>
                    <span className="text-xs font-bold text-emerald-600 w-20 text-left">
                      {formatMoney(item.quantity * item.unitPrice)}
                    </span>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">{t('purchasesPage.notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('purchasesPage.notesPlaceholder')}
            rows={2}
            className="w-full text-sm resize-none"
          />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <span className="text-sm font-bold text-emerald-700">{t('purchasesPage.totalCol')}</span>
          <span className="text-xl font-black text-emerald-700">{formatMoney(totalAmount)} MRU</span>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving || !selectedSupplier || items.length === 0}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? t('purchasesPage.saving') : t('purchasesPage.save')}
        </button>
      </div>
    </div>
  );
}
