import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { customerApi } from '../../api/customer';
import { Plus, Search, Loader2, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPhoneNumber } from '../../lib/utils';
import BottomSheet from '../../components/ui/BottomSheet';

export default function Customers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isManageDebtOpen, setIsManageDebtOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    let isActive = true;
    customerApi.getCustomers()
      .then((res) => {
        if (isActive) setCustomers(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => { isActive = false; };
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.includes(query))
    );
  }, [customers, searchTerm]);

  const handleCreateCustomer = async (data) => {
    const res = await customerApi.createCustomer(data);
    setCustomers((prev) => [...prev, res.data]);
    setIsAddCustomerOpen(false);
  };

  const handleUpdateDebt = async (id, data) => {
    const res = await customerApi.updateDebt(id, data);
    if (!res.success) {
      throw new Error(res.error?.message || 'Impossible de mettre a jour la dette.');
    }
    setCustomers(prev => prev.map(c => c._id === id ? res.data.customer : c));
    setIsManageDebtOpen(false);
    setSelectedCustomer(null);
  };

  const openDebtModal = (customer) => {
    setSelectedCustomer(customer);
    setIsManageDebtOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t('customers')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos clients et leurs dettes.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddCustomerOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </button>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom ou téléphone..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Aucun client trouvé.
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <div key={customer._id} className="px-4 py-3 hover:bg-white/[0.03]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white text-sm">{customer.name}</div>
                    <span className={`font-medium text-sm tabular-nums ${customer.totalDebt > 0 ? 'text-rose-400' : 'text-white'}`}>
                      {customer.totalDebt.toLocaleString()} MRU
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{formatPhoneNumber(customer.phone) || '-'}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDebtModal(customer)}
                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors active:scale-[0.97]"
                      >
                        Dette
                      </button>
                      <Link
                        to={`/admin/customers/${customer._id}`}
                        className="px-3 py-1.5 flex items-center justify-center text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors active:scale-[0.97]"
                      >
                        Détails
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <table className="w-full text-sm text-left hidden sm:table">
            <thead className="text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4 font-medium">Nom</th>
                <th className="px-6 py-4 font-medium">Téléphone</th>
                <th className="px-6 py-4 font-medium text-right">Dette totale (MRU)</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer._id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4 min-w-[120px]">
                      <div className="font-medium text-white text-sm">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatPhoneNumber(customer.phone) || '-'}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className={`font-medium tabular-nums ${customer.totalDebt > 0 ? 'text-rose-400' : 'text-white'}`}>
                        {customer.totalDebt.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openDebtModal(customer)}
                          className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                        >
                          Dette
                        </button>
                        <Link
                          to={`/admin/customers/${customer._id}`}
                          className="px-3 py-1 flex items-center justify-center text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
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

      {isAddCustomerOpen && (
        <AddCustomerModal
          onClose={() => setIsAddCustomerOpen(false)}
          onSubmit={handleCreateCustomer}
        />
      )}

      {isManageDebtOpen && selectedCustomer && (
        <ManageDebtModal
          customer={selectedCustomer}
          onClose={() => {
            setIsManageDebtOpen(false);
            setSelectedCustomer(null);
          }}
          onSubmit={(data) => handleUpdateDebt(selectedCustomer._id, data)}
        />
      )}
    </div>
  );
}

function AddCustomerModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({ name: '', phone: '', initialDebt: '' });
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
        <span className="text-sm font-medium text-slate-300">Nom complet</span>
        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/30 outline-none" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-300">Téléphone (optionnel)</span>
        <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/30 outline-none" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-300">Dette initiale (MRU)</span>
        <input type="number" min="0" value={formData.initialDebt} onChange={e => setFormData({...formData, initialDebt: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/30 outline-none tabular-nums" />
      </label>
      <div className="flex justify-end gap-3 mt-6 pb-4">
        <button type="button" onClick={onClose} className="px-4 py-3 text-sm text-slate-400 hover:bg-white/5 rounded-lg">Annuler</button>
        <button type="submit" disabled={submitting} className="px-4 py-3 text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-500 hover:to-cyan-400 flex gap-2 items-center disabled:opacity-70 shadow-lg shadow-blue-500/25">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Créer
        </button>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobile Bottom Sheet */}
      <BottomSheet isOpen={true} onClose={onClose} title="Nouveau client">
        {formContent}
      </BottomSheet>

      {/* Desktop Modal */}
      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#0d1424] p-6 shadow-xl border border-white/5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Nouveau client</h2>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white/5"><X className="w-5 h-5" /></button>
          </div>
          {formContent}
        </div>
      </div>
    </>
  );
}

function ManageDebtModal({ customer, onClose, onSubmit }) {
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
      <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5 mb-4">
        <span className="text-sm text-slate-400 block mb-1">Dette actuelle</span>
        <span className="text-xl font-bold text-white tabular-nums">{customer.totalDebt.toLocaleString()} MRU</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-2 transition-all active:scale-[0.97] ${formData.type === 'increase' ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-white/5 text-slate-400 hover:bg-white/[0.03]'}`}>
          <input type="radio" name="type" value="increase" checked={formData.type === 'increase'} onChange={() => setFormData({...formData, type: 'increase'})} className="sr-only" />
          <ArrowUpRight className="w-5 h-5" />
          <span className="text-sm font-medium">Augmenter</span>
        </label>
        <label className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-2 transition-all active:scale-[0.97] ${formData.type === 'decrease' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-white/5 text-slate-400 hover:bg-white/[0.03]'}`}>
          <input type="radio" name="type" value="decrease" checked={formData.type === 'decrease'} onChange={() => setFormData({...formData, type: 'decrease'})} className="sr-only" />
          <ArrowDownRight className="w-5 h-5" />
          <span className="text-sm font-medium">Rembourser</span>
        </label>
      </div>

      <label className="block space-y-2 mt-4">
        <span className="text-sm font-medium text-slate-300">Montant (MRU)</span>
        <input type="number" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/30 outline-none tabular-nums" />
      </label>

      {error && <p className="text-sm text-rose-400 mt-2">{error}</p>}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-300">Note (optionnel)</span>
        <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Ex: Paiement en espèces" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/30 outline-none" />
      </label>

      <div className="flex justify-end gap-3 mt-6 pb-4">
        <button type="button" onClick={onClose} className="px-4 py-3 text-sm text-slate-400 hover:bg-white/5 rounded-lg">Annuler</button>
        <button type="submit" disabled={submitting} className={`px-4 py-3 text-sm text-white rounded-lg flex gap-2 items-center disabled:opacity-70 shadow-lg ${formData.type === 'increase' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/25' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'}`}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Valider
        </button>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobile Bottom Sheet */}
      <BottomSheet isOpen={true} onClose={onClose} title={`Gérer la dette - ${customer.name}`}>
        {formContent}
      </BottomSheet>

      {/* Desktop Modal */}
      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-[#0d1424] p-6 shadow-xl border border-white/5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Gérer la dette - {customer.name}</h2>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white/5"><X className="w-5 h-5" /></button>
          </div>
          {formContent}
        </div>
      </div>
    </>
  );
}
