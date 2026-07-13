import { useState, useEffect, useMemo } from 'react';
import { expenseApi } from '../api/expense';
import { Plus, Search, Loader2, X, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../lib/format';
import BottomSheet from '../components/ui/BottomSheet';

const CATEGORY_LABELS = {
  rent: 'expenses.categories.rent',
  utilities: 'expenses.categories.utilities',
  salaries: 'expenses.categories.salaries',
  supplies: 'expenses.categories.supplies',
  maintenance: 'expenses.categories.maintenance',
  transport: 'expenses.categories.transport',
  marketing: 'expenses.categories.marketing',
  taxes: 'expenses.categories.taxes',
  other: 'expenses.categories.other'
};

export default function Expenses() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    let isActive = true;
    expenseApi.getExpenses({})
      .then((res) => {
        if (isActive) setExpenses(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => { isActive = false; };
  }, []);

  const filteredExpenses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return expenses;
    return expenses.filter((e) =>
      e.description.toLowerCase().includes(query) ||
      e.paidByName.toLowerCase().includes(query)
    );
  }, [expenses, searchTerm]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const handleCreate = async (data) => {
    const res = await expenseApi.createExpense(data);
    setExpenses((prev) => [...prev, res.data]);
    setIsAddOpen(false);
  };

  const handleUpdate = async (id, data) => {
    const res = await expenseApi.updateExpense(id, data);
    setExpenses(prev => prev.map(e => e._id === id ? res.data : e));
    setIsEditOpen(false);
    setSelectedExpense(null);
  };

  const handleDelete = async (id) => {
    await expenseApi.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e._id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {t('expenses.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('expenses.description')}</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          {t('expenses.addButton')}
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-surface-border overflow-hidden">
        <div className="p-4 border-b border-surface-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('expenses.searchPlaceholder')}
              className="w-full rounded-xl pl-9 pr-4 py-3 text-sm"
            />
          </div>
        </div>

        {filteredExpenses.length > 0 && (
          <div className="px-4 py-3 border-b border-surface-border">
            <span className="text-sm text-muted-foreground">
              {t('expenses.totalExpenses')}: <strong className="text-text-primary tabular-nums">{totalAmount.toLocaleString()} MRU</strong>
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-surface-border">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {t('expenses.emptyState')}
              </div>
            ) : (
              filteredExpenses.map(expense => (
                <div key={expense._id} className="px-4 py-3 hover:bg-accent">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-text-primary text-sm">{expense.description}</div>
                    <span className="font-medium text-rose-600 dark:text-rose-400 text-sm tabular-nums">
                      -{expense.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium bg-primary/10 text-primary">
                      {t(CATEGORY_LABELS[expense.category] || expense.category)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{expense.paidByName}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedExpense(expense); setIsEditOpen(true); }}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors active:scale-[0.97]"
                        title={t('expenses.edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="p-2 text-muted-foreground hover:text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors active:scale-[0.97]"
                        title={t('expenses.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                <th className="px-6 py-4 font-medium">{t('expenses.table.date')}</th>
                <th className="px-6 py-4 font-medium">{t('expenses.table.description')}</th>
                <th className="px-6 py-4 font-medium">{t('expenses.table.category')}</th>
                <th className="px-6 py-4 font-medium">{t('expenses.table.paidBy')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('expenses.table.amount')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('expenses.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">
                    {t('expenses.emptyState')}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => (
                  <tr key={expense._id} className="hover:bg-accent transition-colors">
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{expense.description}</div>
                      {expense.note && (
                        <div className="text-xs text-muted-foreground mt-0.5">{expense.note}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                        {t(CATEGORY_LABELS[expense.category] || expense.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{expense.paidByName}</td>
                    <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-400 tabular-nums">
                      -{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setSelectedExpense(expense); setIsEditOpen(true); }}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title={t('expenses.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense._id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title={t('expenses.delete')}
                        >
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
      </div>

      {isAddOpen && (
        <ExpenseFormModal
          onClose={() => setIsAddOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {isEditOpen && selectedExpense && (
        <ExpenseFormModal
          expense={selectedExpense}
          onClose={() => { setIsEditOpen(false); setSelectedExpense(null); }}
          onSubmit={(data) => handleUpdate(selectedExpense._id, data)}
        />
      )}
    </div>
  );
}

function ExpenseFormModal({ expense, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    description: expense?.description || '',
    category: expense?.category || 'other',
    amount: expense?.amount || '',
    note: expense?.note || '',
    date: expense?.date ? expense.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
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

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-text-secondary">{t('expenses.form.description')}</span>
        <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required className="w-full rounded-xl px-4 py-3" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-text-secondary">{t('expenses.form.category')}</span>
        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="w-full rounded-xl px-4 py-3">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{t(label)}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-text-secondary">{t('expenses.form.amount')}</span>
          <input type="number" min="1" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required className="w-full rounded-xl px-4 py-3 tabular-nums" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-text-secondary">{t('expenses.form.date')}</span>
          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="w-full rounded-xl px-4 py-3" />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-text-secondary">{t('expenses.form.note')}</span>
        <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} rows="2" className="w-full rounded-xl px-4 py-3 resize-none" />
      </label>
      <div className="flex justify-end gap-3 mt-6 pb-4">
        <button type="button" onClick={onClose} className="px-4 py-3 text-sm text-muted-foreground hover:bg-accent rounded-lg">{t('expenses.cancel')}</button>
        <button type="submit" disabled={submitting} className="px-4 py-3 text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-500 hover:to-cyan-400 flex gap-2 items-center disabled:opacity-70 shadow-lg shadow-blue-500/25">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />} {expense ? t('expenses.save') : t('expenses.create')}
        </button>
      </div>
    </form>
  );

  return (
    <>
      {/* Mobile Bottom Sheet */}
      <BottomSheet isOpen={true} onClose={onClose} title={expense ? t('expenses.editTitle') : t('expenses.addTitle')}>
        {formContent}
      </BottomSheet>

      {/* Desktop Modal */}
      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-surface-border">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              {expense ? t('expenses.editTitle') : t('expenses.addTitle')}
            </h2>
            <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-accent"><X className="w-5 h-5" /></button>
          </div>
          {formContent}
        </div>
      </div>
    </>
  );
}
