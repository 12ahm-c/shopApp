import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Eye, Search, X, Loader2 } from 'lucide-react';
import { purchaseApi } from '../../api/purchase';
import { supplierApi } from '../../api/supplier';
import { formatMoney } from '../../lib/format';

export default function PurchasesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

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
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        if (filters.supplierId) params.supplierId = filters.supplierId;
        if (filters.search) params.search = filters.search;
        params.page = filters.page;
        params.limit = filters.limit;

        const res = await purchaseApi.getPurchases(params);
        if (!cancelled && mountedRef.current) {
          setPurchases(res.data || []);
          setTotalAmount(res.meta?.total || 0);
          setTotalCount(res.meta?.total || 0);
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

  const handleViewPurchase = async (id) => {
    try {
      const res = await purchaseApi.getPurchaseById(id);
      if (mountedRef.current) setSelectedPurchase(res.data);
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
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            {t('purchasesPage.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('purchasesPage.totalDisplayed')}: {formatMoney(totalAmount)} MRU | {t('purchasesPage.countDisplayed')}: {totalCount}
          </p>
        </div>
        <button
          onClick={() => navigate('/purchases/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          {t('purchasesPage.newPurchase')}
        </button>
      </div>

      <div className="bg-card border border-surface-border rounded-2xl p-4">
        <div className="flex items-center gap-2 text-text-secondary mb-3">
          <Search className="w-4 h-4" />
          <span className="text-sm font-semibold">{t('purchasesPage.filters')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('purchasesPage.from')}</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('purchasesPage.to')}</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('purchasesPage.supplierFilter')}</label>
            <select
              value={filters.supplierId}
              onChange={(e) => handleFilterChange('supplierId', e.target.value)}
              className="w-full text-sm"
            >
              <option value="">{t('purchasesPage.allSuppliers')}</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{t('purchasesPage.search')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder={t('purchasesPage.search')}
                className="flex-1 text-sm"
              />
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
              >
                {t('purchasesPage.reset')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-surface-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">{t('purchasesPage.noPurchases')}</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-secondary/30">
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary">{t('purchasesPage.purchaseNumber')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary">{t('purchasesPage.date')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-text-secondary">{t('purchasesPage.supplierCol')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary">{t('purchasesPage.amountCol')}</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-secondary">{t('purchasesPage.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase._id} className="border-b border-surface-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-text-primary">{purchase.purchaseNumber}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(purchase.createdAt)}</td>
                      <td className="px-4 py-3 text-text-primary">{purchase.supplierName}</td>
                      <td className="px-4 py-3 text-left font-bold text-emerald-600">{formatMoney(purchase.totalAmount)} MRU</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewPurchase(purchase._id)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          title={t('purchasesPage.view')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-surface-border">
              {purchases.map((purchase) => (
                <div
                  key={purchase._id}
                  className="p-4 hover:bg-secondary/20 transition-colors cursor-pointer"
                  onClick={() => handleViewPurchase(purchase._id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-text-primary">{purchase.purchaseNumber}</span>
                    <span className="font-bold text-emerald-600 text-sm">{formatMoney(purchase.totalAmount)} MRU</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{purchase.supplierName}</span>
                    <span>{formatDate(purchase.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPurchase(null)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <h2 className="text-lg font-bold text-text-primary">{t('purchasesPage.detailTitle')}</h2>
              <button onClick={() => setSelectedPurchase(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('purchasesPage.purchaseNumber')}: </span>
                  <span className="font-bold font-mono">{selectedPurchase.purchaseNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('purchasesPage.date')}: </span>
                  <span>{formatDate(selectedPurchase.createdAt)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">{t('purchasesPage.supplierCol')}: </span>
                  <span className="font-bold">{selectedPurchase.supplierName}</span>
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
                    {(selectedPurchase.items || []).map((item, i) => (
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
                <span className="text-lg font-black text-emerald-700">{formatMoney(selectedPurchase.totalAmount)} MRU</span>
              </div>

              {selectedPurchase.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('purchasesPage.notes')}: </span>
                  <span>{selectedPurchase.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
