import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supplierApi } from '../../api/supplier';
import { Plus, Search, Loader2, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPhoneNumber } from '../../lib/utils';
import BottomSheet from '../../components/ui/BottomSheet';

export default function Suppliers() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isManageDebtOpen, setIsManageDebtOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    let isActive = true;
    supplierApi.getSuppliers()
      .then((res) => {
        if (isActive) setSuppliers(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => { isActive = false; };
  }, []);

  const filteredSuppliers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return suppliers;
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(query) ||
      (s.phone && s.phone.includes(query)) ||
      (s.address && s.address.toLowerCase().includes(query))
    );
  }, [suppliers, searchTerm]);

  const handleCreate = async (data) => {
    const res = await supplierApi.createSupplier(data);
    setSuppliers((prev) => [...prev, res.data]);
    setIsAddOpen(false);
  };

  const handleUpdateDebt = async (id, data) => {
    const res = await supplierApi.updateDebt(id, data);
    if (!res.success) {
      throw new Error(res.error?.message || 'Impossible de mettre a jour la dette.');
    }
    setSuppliers(prev => prev.map(s => s._id === id ? res.data.supplier : s));
    setIsManageDebtOpen(false);
    setSelectedSupplier(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {t('suppliersPage.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('suppliersPage.description')}</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          {t('suppliersPage.addButton')}
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-surface-border overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('suppliersPage.searchPlaceholder')}
              className="!pl-9 !pr-4 !py-2.5"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-surface-border">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {t('suppliersPage.emptyState')}
              </div>
            ) : (
              filteredSuppliers.map(supplier => (
                <div key={supplier._id} className="px-4 py-3 hover:bg-accent">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-text-primary text-sm">{supplier.name}</div>
                    <span className={`font-medium text-sm tabular-nums ${supplier.totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-text-primary'}`}>
                      {supplier.totalDebt.toLocaleString()} MRU
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">{supplier.address || '-'}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatPhoneNumber(supplier.phone) || '-'}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedSupplier(supplier); setIsManageDebtOpen(true); }}
                        className="px-3 py-1.5 text-xs bg-accent hover:bg-surface-hover text-text-secondary rounded-lg transition-colors active:scale-[0.97]"
                      >
                        {t('suppliersPage.debt')}
                      </button>
                      <Link
                        to={`/admin/suppliers/${supplier._id}`}
                        className="px-3 py-1.5 flex items-center justify-center text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors active:scale-[0.97]"
                      >
                        {t('suppliersPage.details')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <table className="w-full text-sm text-left hidden sm:table">
            <thead className="text-muted-foreground font-medium">
              <tr>
                <th className="px-6 py-4 font-medium">{t('suppliersPage.nameAddress')}</th>
                <th className="px-6 py-4 font-medium">{t('suppliersPage.phone')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('suppliersPage.debt')} (MRU)</th>
                <th className="px-6 py-4 font-medium text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    {t('suppliersPage.emptyState')}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(supplier => (
                  <tr key={supplier._id} className="hover:bg-accent transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{supplier.name}</div>
                      <div className="text-xs text-muted-foreground">{supplier.address || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{formatPhoneNumber(supplier.phone) || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium tabular-nums ${supplier.totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-text-primary'}`}>
                        {supplier.totalDebt.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setSelectedSupplier(supplier); setIsManageDebtOpen(true); }}
                          className="px-3 py-1 text-sm bg-accent hover:bg-surface-hover text-text-secondary rounded-lg transition-colors"
                        >
                          {t('suppliersPage.debt')}
                        </button>
                        <Link
                          to={`/admin/suppliers/${supplier._id}`}
                          className="px-3 py-1 flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                        >
                          {t('suppliersPage.details')}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddOpen && (
        <AddSupplierModal onClose={() => setIsAddOpen(false)} onSubmit={handleCreate} />
      )}

      {isManageDebtOpen && selectedSupplier && (
        <ManageDebtModal
          supplier={selectedSupplier}
          onClose={() => { setIsManageDebtOpen(false); setSelectedSupplier(null); }}
          onSubmit={(data) => handleUpdateDebt(selectedSupplier._id, data)}
        />
      )}
    </div>
  );
}

function AddSupplierModal({ onClose, onSubmit }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', initialDebt: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ ...formData, initialDebt: Number(formData.initialDebt || 0) });
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-text-secondary">{t('suppliersPage.name')}</span>
        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-text-secondary">{t('suppliersPage.phone')}</span>
        <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-text-secondary">{t('suppliersPage.address')}</span>
        <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-text-secondary">{t('suppliersPage.initialDebt')}</span>
        <input type="number" min="0" value={formData.initialDebt} onChange={e => setFormData({...formData, initialDebt: e.target.value})} className="!tabular-nums" />
      </label>
      <div className="flex justify-end gap-3 mt-6 pb-4">
        <button type="button" onClick={onClose} className="px-4 py-3 text-sm text-muted-foreground hover:bg-accent rounded-lg">{t('suppliersPage.cancel')}</button>
        <button type="submit" disabled={submitting} className="px-4 py-3 text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-500 hover:to-cyan-400 flex gap-2 items-center disabled:opacity-70 shadow-lg shadow-blue-500/25">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />} {t('suppliersPage.create')}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <BottomSheet isOpen={true} onClose={onClose} title={t('suppliersPage.addTitle')}>
        {formContent}
      </BottomSheet>
      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-surface-border">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">{t('suppliersPage.addTitle')}</h2>
            <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-accent"><X className="w-5 h-5" /></button>
          </div>
          {formContent}
        </div>
      </div>
    </>
  );
}

function ManageDebtModal({ supplier, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ amount: '', type: 'increase', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const amount = Number(formData.amount || 0);
    if (Number.isNaN(amount)) {
      setError("Le montant de diminution ne peut pas dépasser la dette actuelle.");
      setSubmitting(false);
      return;
    }
    try {
      await onSubmit({ ...formData, amount });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-card rounded-xl border border-surface-border mb-4">
        <span className="text-sm text-muted-foreground block mb-1">{t('suppliersPage.currentDebt', { name: supplier.name })}</span>
        <span className="text-xl font-bold text-text-primary tabular-nums">{supplier.totalDebt.toLocaleString()} MRU</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-2 transition-all active:scale-[0.97] ${formData.type === 'increase' ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'border-surface-border text-muted-foreground hover:bg-accent'}`}>
          <input type="radio" name="type" value="increase" checked={formData.type === 'increase'} onChange={() => setFormData({...formData, type: 'increase'})} className="sr-only" />
          <ArrowUpRight className="w-5 h-5" />
          <span className="text-sm font-medium text-center">{t('suppliersPage.increaseDebt')}</span>
        </label>
        <label className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-2 transition-all active:scale-[0.97] ${formData.type === 'decrease' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-surface-border text-muted-foreground hover:bg-accent'}`}>
          <input type="radio" name="type" value="decrease" checked={formData.type === 'decrease'} onChange={() => setFormData({...formData, type: 'decrease'})} className="sr-only" />
          <ArrowDownRight className="w-5 h-5" />
          <span className="text-sm font-medium text-center">{t('suppliersPage.repayDebt')}</span>
        </label>
      </div>

      <label className="block space-y-2 mt-4">
        <span className="text-sm font-medium text-text-secondary">{t('suppliersPage.amount')}</span>
        <input type="number" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required className="!tabular-nums" />
      </label>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400 mt-2">{error}</p>}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-text-secondary">{t('suppliersPage.note')}</span>
        <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Ex: Paiement facture N° 12" />
      </label>

      <div className="flex justify-end gap-3 mt-6 pb-4">
        <button type="button" onClick={onClose} className="px-4 py-3 text-sm text-muted-foreground hover:bg-accent rounded-lg">{t('suppliersPage.cancel')}</button>
        <button type="submit" disabled={submitting} className={`px-4 py-3 text-sm text-white rounded-lg flex gap-2 items-center disabled:opacity-70 shadow-lg ${formData.type === 'increase' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/25' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'}`}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />} {t('suppliersPage.validate')}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <BottomSheet isOpen={true} onClose={onClose} title={t('suppliersPage.manageDebt')}>
        {formContent}
      </BottomSheet>
      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-surface-border">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">{t('suppliersPage.manageDebt')}</h2>
            <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-accent"><X className="w-5 h-5" /></button>
          </div>
          {formContent}
        </div>
      </div>
    </>
  );
}
