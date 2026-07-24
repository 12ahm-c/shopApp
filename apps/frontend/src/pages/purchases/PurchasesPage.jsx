import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Minus, Trash2, ShoppingCart, X,
  CheckCircle2, Loader2, RefreshCcw, Package, ReceiptText,
  CalendarDays, Eye, Filter, SearchX, Search, Store, Save
} from 'lucide-react';
import { purchaseApi } from '../../api/purchase';
import { supplierApi } from '../../api/supplier';
import { productApi } from '../../api/product';
import { formatMoney, formatDateTime } from '../../lib/format';

function PurchaseForm({ onSuccess }) {
  const { t } = useTranslation();
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
      setItems([]);
      setSelectedSupplier(null);
      setSupplierSearch('');
      setNotes('');
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.response?.data?.error?.message || t('purchasesPage.saveFailed'));
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">

      {error && (
        <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl border border-rose-500/20">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{t('purchasesPage.createSuccess')}</h2>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-surface-border p-4 relative">
        {selectedSupplier ? (
          <div className="flex items-center justify-between bg-primary/10 p-3 rounded-xl border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm text-text-primary">{selectedSupplier.name}</p>
                {selectedSupplier.phone && (
                  <p className="text-xs text-muted-foreground">{selectedSupplier.phone}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => { setSelectedSupplier(null); setSupplierSearch(''); }}
              className="p-2 hover:bg-surface-hover rounded-xl text-muted-foreground hover:text-rose-600 dark:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder={t('purchasesPage.selectSupplier')}
              value={supplierSearch}
              onChange={(e) => {
                setSupplierSearch(e.target.value);
                setShowSupplierDropdown(true);
                if (!e.target.value) setSelectedSupplier(null);
              }}
              onFocus={() => setShowSupplierDropdown(true)}
              className="!px-4 !py-2.5"
            />
            {showSupplierDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-surface border border-surface-border shadow-2xl rounded-xl overflow-hidden">
                {filteredSuppliers.length === 0 && (
                  <div className="px-4 py-3 text-xs text-muted-foreground">
                    {t('purchasesPage.noResults')}
                  </div>
                )}
                {filteredSuppliers.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex justify-between items-center"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedSupplier(s);
                      setSupplierSearch(s.name);
                      setShowSupplierDropdown(false);
                    }}
                  >
                    <span className="font-medium text-sm text-text-primary">{s.name}</span>
                    {s.phone && <span className="text-xs text-muted-foreground">{s.phone}</span>}
                  </button>
                ))}
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 text-primary text-sm font-medium border-t border-surface-border flex items-center gap-2"
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
        )}
      </div>

      {showNewSupplierForm && (
        <div className="bg-card rounded-2xl border border-surface-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">{t('purchasesPage.newSupplier')}</h3>
            <button onClick={() => setShowNewSupplierForm(false)} className="p-1.5 rounded-lg hover:bg-accent">
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
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {creatingSupplier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t('purchasesPage.addSupplier')}
          </button>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-surface-border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setShowProductDropdown(true);
            }}
            onFocus={() => setShowProductDropdown(true)}
            placeholder={t('purchasesPage.searchProducts')}
            className="!pl-10 w-full text-sm"
          />
          {showProductDropdown && productSearch && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-surface-border shadow-2xl rounded-xl overflow-hidden max-h-48 overflow-y-auto">
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
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addProduct(p);
                      }}
                    >
                      <div className="font-medium text-sm text-text-primary">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(p.costPrice || p.price)} | {t('purchasesPage.stock')}: {p.quantity}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-primary/10 text-primary text-sm font-medium border-t border-surface-border flex items-center gap-2"
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
      </div>

      <div className="bg-card rounded-2xl border border-surface-border overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <ShoppingCart className="w-4 h-4" />
            {t('purchasesPage.items')}
          </div>
          <span className="text-lg font-bold text-emerald-600 tabular-nums">
            {formatMoney(totalAmount)}
          </span>
        </div>

        <div className="divide-y divide-surface-border max-h-[40vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground py-10 space-y-2">
              <Package className="w-12 h-12 opacity-10" />
              <p className="text-sm">{t('purchasesPage.emptyItems')}</p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 sm:p-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-text-primary truncate">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseInt(e.target.value) || 0)}
                      className="w-16 text-xs font-semibold text-primary bg-transparent border border-surface-border rounded-lg px-2 py-1 focus:outline-none tabular-nums"
                    />
                    <span className="text-[10px] text-muted-foreground">MRU</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-accent border border-surface-border rounded-lg p-0.5">
                  <button
                    onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                    className="p-1.5 rounded-md hover:bg-surface-hover text-muted-foreground"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center text-text-primary tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                    className="p-1.5 rounded-md hover:bg-surface-hover text-muted-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(index)}
                  className="p-1.5 text-muted-foreground hover:text-rose-600 dark:text-rose-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-surface-border p-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('purchasesPage.notesPlaceholder')}
          rows={2}
          className="w-full text-sm resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving || !selectedSupplier || items.length === 0}
        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('purchasesPage.saving')}...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            {t('purchasesPage.save')}
          </>
        )}
      </button>
    </div>
  );
}

const toStartOfDay = (date) => date ? `${date}T00:00:00.000Z` : '';
const toEndOfDay = (date) => date ? `${date}T23:59:59.999Z` : '';

function PurchasesHistory({ onViewPurchase }) {
  const { t } = useTranslation();
  const mountedRef = useRef(true);

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    supplierId: '',
    search: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = {};
        if (filters.from) params.from = toStartOfDay(filters.from);
        if (filters.to) params.to = toEndOfDay(filters.to);
        if (filters.supplierId) params.supplierId = filters.supplierId;
        if (filters.search) params.search = filters.search;
        params.page = filters.page;
        params.limit = filters.limit;

        const res = await purchaseApi.getPurchases(params);
        if (!cancelled && mountedRef.current) {
          setPurchases(res.data || []);
          setTotalAmount(res.data?.reduce((sum, p) => sum + (p.totalAmount || 0), 0) || 0);
          setTotalCount(res.meta?.total || res.data?.length || 0);
        }
      } catch {
        if (!cancelled && mountedRef.current) {
          setPurchases([]);
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await supplierApi.getSuppliers({ limit: 100 });
        if (!cancelled && mountedRef.current) {
          setSuppliers(res.data || []);
        }
      } catch {
        // silent
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({ from: '', to: '', supplierId: '', search: '', page: 1, limit: 20 });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-border bg-card px-4 py-2.5 text-sm font-semibold text-text-primary tabular-nums">
        {t('purchasesPage.totalDisplayed')}: {formatMoney(totalAmount)} | {t('purchasesPage.countDisplayed')}: {totalCount}
      </div>

      <section className="rounded-2xl border border-surface-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Filter className="h-4 w-4" />
          {t('purchasesPage.filters')}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('purchasesPage.from')}</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              className="max-w-[200px]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('purchasesPage.to')}</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              className="max-w-[200px]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('purchasesPage.supplierFilter')}</span>
            <select
              value={filters.supplierId}
              onChange={(e) => handleFilterChange('supplierId', e.target.value)}
              className="max-w-[200px]"
            >
              <option value="">{t('purchasesPage.allSuppliers')}</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('purchasesPage.search')}</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder={t('purchasesPage.search')}
                className="flex-1"
              />
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent active:scale-[0.97]"
              >
                <SearchX className="h-4 w-4" />
                {t('purchasesPage.reset')}
              </button>
            </div>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-surface-border bg-card">
        {loading && (
          <div className="flex items-center justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}
        {!loading && purchases.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">{t('purchasesPage.noPurchases')}</div>
        )}
        {!loading && purchases.length > 0 && (
          <>
            <div className="sm:hidden divide-y divide-surface-border">
              {purchases.map((purchase) => (
                <button
                  key={purchase._id}
                  onClick={() => onViewPurchase(purchase._id)}
                  className="block w-full text-left px-4 py-3 hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-text-primary text-sm">{purchase.purchaseNumber}</div>
                    <div className="font-bold text-sm text-text-primary tabular-nums">{formatMoney(purchase.totalAmount)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{purchase.supplierName}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(purchase.createdAt)}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-surface-border bg-secondary/30">
                    <th className="px-4 py-3 font-semibold">{t('purchasesPage.purchaseNumber')}</th>
                    <th className="px-4 py-3 font-semibold">{t('purchasesPage.date')}</th>
                    <th className="px-4 py-3 font-semibold">{t('purchasesPage.supplierCol')}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t('purchasesPage.amountCol')}</th>
                    <th className="px-4 py-3 font-semibold text-center">{t('purchasesPage.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {purchases.map((purchase) => (
                    <tr key={purchase._id} className="hover:bg-accent transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">{purchase.purchaseNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(purchase.createdAt)}</td>
                      <td className="px-4 py-3 text-text-primary">{purchase.supplierName}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">{formatMoney(purchase.totalAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onViewPurchase(purchase._id)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default function PurchasesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('new');
  const [detailPurchase, setDetailPurchase] = useState(null);

  const handleViewPurchase = async (id) => {
    try {
      const res = await purchaseApi.getPurchaseById(id);
      setDetailPurchase(res.data);
    } catch {
      // silent
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('ar-MR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 p-1 bg-card rounded-2xl border border-surface-border">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'new'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <Plus className="w-4 h-4" />
          {t('purchasesPage.newPurchase')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          {t('sales.tabHistory')}
        </button>
      </div>

      {activeTab === 'new' ? (
        <PurchaseForm onSuccess={() => setActiveTab('history')} />
      ) : (
        <PurchasesHistory onViewPurchase={handleViewPurchase} />
      )}

      {detailPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailPurchase(null)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <h2 className="text-lg font-bold text-text-primary">{t('purchasesPage.detailTitle')}</h2>
              <button onClick={() => setDetailPurchase(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('purchasesPage.purchaseNumber')}: </span>
                  <span className="font-bold font-mono">{detailPurchase.purchaseNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('purchasesPage.date')}: </span>
                  <span>{formatDate(detailPurchase.createdAt)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('purchasesPage.supplierCol')}: </span>
                  <span className="font-bold">{detailPurchase.supplierName}</span>
                </div>
              </div>

              <div className="border border-surface-border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary/30 border-b border-surface-border">
                      <th className="text-right px-3 py-2 font-semibold">{t('purchasesPage.itemsPurchased')}</th>
                      <th className="text-center px-3 py-2 font-semibold">{t('purchasesPage.qtyCol')}</th>
                      <th className="text-center px-3 py-2 font-semibold">{t('purchasesPage.unitPriceCol')}</th>
                      <th className="text-left px-3 py-2 font-semibold">{t('purchasesPage.totalCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailPurchase.items || []).map((item, i) => (
                      <tr key={i} className="border-b border-surface-border/50">
                        <td className="px-3 py-2 text-text-primary">{item.name}</td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-center">{formatMoney(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-left font-bold">{formatMoney(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <span className="text-sm font-bold text-emerald-700">{t('purchasesPage.amountCol')}</span>
                <span className="text-lg font-black text-emerald-700">{formatMoney(detailPurchase.totalAmount)}</span>
              </div>

              {detailPurchase.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('purchasesPage.notes')}: </span>
                  <span>{detailPurchase.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
