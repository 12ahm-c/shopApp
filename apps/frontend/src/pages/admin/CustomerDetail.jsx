import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi } from '../../api/customer';
import { Loader2, ArrowLeft, Trash2, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPhoneNumber } from '../../lib/utils';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerApi.getCustomerById(id)
      .then(res => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      const res = await customerApi.deleteCustomer(id);
      if (res.success) navigate('/admin/customers');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }
  if (!data?.customer) {
    return <div className="p-12 text-center text-slate-500">Client introuvable</div>;
  }

  const { customer } = data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/admin/customers" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{customer.name}</h1>
          <p className="text-sm text-slate-500">{formatPhoneNumber(customer.phone) || 'Aucun téléphone'}</p>
        </div>
        <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Dette Totale</h3>
          <p className={`text-3xl font-bold mt-2 ${customer.totalDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {customer.totalDebt.toLocaleString()} <span className="text-lg">MRU</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Client depuis</h3>
            <p className="text-lg font-medium text-slate-900 dark:text-white">
              {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Historique des transactions</h2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {customer.transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Aucune transaction trouvée.</div>
          ) : (
            customer.transactions.map((tx, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'increase' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                    {tx.type === 'increase' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {tx.type === 'increase' ? 'Augmentation de la dette' : 'Remboursement'}
                    </p>
                    <div className="flex gap-2 text-sm text-slate-500">
                      <span>{new Date(tx.date).toLocaleDateString('fr-FR')}</span>
                      {tx.note && <span>• {tx.note}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${tx.type === 'increase' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {tx.type === 'increase' ? '+' : '-'}{tx.amount.toLocaleString()} MRU
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Solde: {tx.newTotalDebt.toLocaleString()} MRU</p>
                </div>
              </div>
            ))
          ).reverse()}
        </div>
      </div>
    </div>
  );
}
