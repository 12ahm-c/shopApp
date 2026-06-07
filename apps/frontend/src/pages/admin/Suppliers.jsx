import { useState, useEffect, useMemo } from 'react';
import { supplierApi } from '../../api/supplier';
import { Plus, Search, Loader2, X, ArrowUpRight, ArrowDownRight, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPhoneNumber } from '../../lib/utils';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isManageDebtOpen, setIsManageDebtOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierToEdit, setSupplierToEdit] = useState(null);

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

  const handleSaveSupplier = async (data) => {
    if (supplierToEdit) {
      const res = await supplierApi.updateSupplier(supplierToEdit._id, data);
      setSuppliers((prev) => prev.map(s => s._id === supplierToEdit._id ? { ...s, ...res.data } : s));
    } else {
      const res = await supplierApi.createSupplier(data);
      setSuppliers((prev) => [...prev, res.data]);
    }
    setIsSupplierModalOpen(false);
    setSupplierToEdit(null);
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      try {
        await supplierApi.deleteSupplier(id);
        setSuppliers(prev => prev.filter(s => s._id !== id));
      } catch (err) {
        alert(err?.response?.data?.error?.message || 'Erreur lors de la suppression du fournisseur');
      }
    }
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Fournisseurs
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos fournisseurs et vos dettes envers eux.</p>
        </div>
        <button
          onClick={() => {
            setSupplierToEdit(null);
            setIsSupplierModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouveau fournisseur
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4 font-medium">Nom & Adresse</th>
                <th className="px-6 py-4 font-medium">Téléphone</th>
                <th className="px-6 py-4 font-medium text-right">Dette (MRU)</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    Aucun fournisseur trouvé.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(supplier => (
                  <tr key={supplier._id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{supplier.name}</div>
                      <div className="text-xs text-slate-500">{supplier.address || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatPhoneNumber(supplier.phone) || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${supplier.totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                        {supplier.totalDebt.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setSelectedSupplier(supplier); setIsManageDebtOpen(true); }}
                          className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
                        >
                          Dette
                        </button>
                        <button
                          onClick={() => {
                            setSupplierToEdit(supplier);
                            setIsSupplierModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(supplier._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/admin/suppliers/${supplier._id}`}
                          className="px-3 py-1 flex items-center justify-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
                        >
                          Détails
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

      {isSupplierModalOpen && (
        <SupplierModal 
          supplier={supplierToEdit}
          onClose={() => {
            setIsSupplierModalOpen(false);
            setSupplierToEdit(null);
          }} 
          onSubmit={handleSaveSupplier} 
        />
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

function SupplierModal({ supplier, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ 
    name: supplier?.name || '', 
    phone: supplier?.phone || '', 
    address: supplier?.address || '', 
    initialDebt: supplier?.totalDebt || '' 
  });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {supplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nom / Raison sociale</span>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Téléphone</span>
            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Adresse</span>
            <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
          </label>
          {!supplier && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dette initiale (MRU)</span>
              <input type="number" min="0" value={formData.initialDebt} onChange={e => setFormData({...formData, initialDebt: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
            </label>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800">Annuler</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex gap-2 items-center disabled:opacity-70">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} 
              {supplier ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageDebtModal({ supplier, onClose, onSubmit }) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Gérer la dette fournisseur</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
            <span className="text-sm text-slate-500 block mb-1">Dette actuelle vers {supplier.name}</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">{supplier.totalDebt.toLocaleString()} MRU</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 transition-all ${formData.type === 'increase' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <input type="radio" name="type" value="increase" checked={formData.type === 'increase'} onChange={() => setFormData({...formData, type: 'increase'})} className="sr-only" />
              <ArrowUpRight className="w-5 h-5" />
              <span className="text-sm font-medium text-center">Augmenter la dette (Achat à crédit)</span>
            </label>
            <label className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 transition-all ${formData.type === 'decrease' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <input type="radio" name="type" value="decrease" checked={formData.type === 'decrease'} onChange={() => setFormData({...formData, type: 'decrease'})} className="sr-only" />
              <ArrowDownRight className="w-5 h-5" />
              <span className="text-sm font-medium text-center">Rembourser (Paiement)</span>
            </label>
          </div>

          <label className="block space-y-2 mt-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant (MRU)</span>
            <input type="number" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
          </label>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400 mt-2">{error}</p>}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Note (optionnel)</span>
            <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Ex: Paiement facture N° 12" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
          </label>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800">Annuler</button>
            <button type="submit" disabled={submitting} className={`px-4 py-2 text-sm text-white rounded-lg flex gap-2 items-center disabled:opacity-70 ${formData.type === 'increase' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
