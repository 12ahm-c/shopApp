import { useState, useEffect, useMemo, useCallback } from 'react';
import { expenseApi } from '../../api/expense';
import { Plus, Filter, Loader2, X, SearchX, Edit, Trash2 } from 'lucide-react';
import { formatPhoneNumber } from '../../lib/utils'; // Optional if not needed

const categoryLabels = {
  salary: 'Salaire',
  rent: 'Loyer',
  utility: 'Factures (Eau/Elec)',
  other: 'Autre'
};

const formatDateTime = (isoDate) => {
  if (!isoDate) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium'
  }).format(new Date(isoDate));
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  
  const [filters, setFilters] = useState({
    category: '',
    from: '',
    to: ''
  });
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const requestParams = useMemo(() => ({
    page,
    limit: 20,
    category: filters.category,
    from: filters.from ? `${filters.from}T00:00:00.000Z` : '',
    to: filters.to ? `${filters.to}T23:59:59.999Z` : ''
  }), [filters, page]);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseApi.getExpenses(requestParams);
      if (res.success) {
        setExpenses(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [requestParams]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadExpenses();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadExpenses]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(current => ({ ...current, [name]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ category: '', from: '', to: '' });
    setPage(1);
  };

  const handleSave = async (data) => {
    if (expenseToEdit) {
      const res = await expenseApi.updateExpense(expenseToEdit._id, data);
      setExpenses(prev => prev.map(e => e._id === expenseToEdit._id ? res.data : e));
    } else {
      const res = await expenseApi.createExpense(data);
      if (page === 1) {
        setExpenses(prev => [res.data, ...prev].slice(0, 20));
      } else {
        setPage(1);
      }
    }
    setIsModalOpen(false);
    setExpenseToEdit(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      try {
        await expenseApi.deleteExpense(id);
        setExpenses(prev => prev.filter(e => e._id !== id));
      } catch (err) {
        alert(err?.response?.data?.error?.message || 'Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dépenses</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez vos charges et dépenses d'exploitation.</p>
        </div>
        <button
          onClick={() => { setExpenseToEdit(null); setIsModalOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouvelle dépense
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Filter className="h-4 w-4" /> Filtres
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Catégorie</span>
            <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value="">Toutes les catégories</option>
              {Object.entries(categoryLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Depuis</span>
            <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Jusqu'au</span>
            <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
            <SearchX className="w-4 h-4" /> Réinitialiser
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Titre</th>
                <th className="px-6 py-4 font-medium">Catégorie</th>
                <th className="px-6 py-4 font-medium text-right">Montant (MRU)</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    Aucune dépense trouvée.
                  </td>
                </tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense._id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatDateTime(expense.date)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{expense.title}</div>
                      {expense.note && <div className="text-xs text-slate-500">{expense.note}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {categoryLabels[expense.category] || expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                      {expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setExpenseToEdit(expense); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-md transition-colors" title="Modifier">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(expense._id)} className="p-1.5 text-slate-400 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-md transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-slate-800">
            <span className="text-sm text-slate-500">
              Page {meta.page} sur {Math.ceil(meta.total / meta.limit) || 1}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">Précédent</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(meta.total / meta.limit)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">Suivant</button>
            </div>
          </div>
        )}
      </section>

      {isModalOpen && (
        <ExpenseModal 
          expense={expenseToEdit} 
          onClose={() => { setIsModalOpen(false); setExpenseToEdit(null); }} 
          onSubmit={handleSave} 
        />
      )}
    </div>
  );
}

function ExpenseModal({ expense, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ 
    title: expense?.title || '', 
    amount: expense?.amount || '', 
    category: expense?.category || 'other',
    date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
    note: expense?.note || ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ 
        ...formData, 
        amount: Number(formData.amount),
        date: new Date(formData.date).toISOString() 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Titre</span>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant (MRU)</span>
              <input type="number" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</span>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Catégorie</span>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none">
              {Object.entries(categoryLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Note</span>
            <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none" />
          </label>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800">Annuler</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex gap-2 items-center disabled:opacity-70">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} {expense ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
