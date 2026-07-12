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
        <Link to="/admin/customers" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">{customer.name}</h1>
          <p className="text-sm text-slate-500">{formatPhoneNumber(customer.phone) || 'Aucun téléphone'}</p>
        </div>
        <button onClick={handleDelete} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5">
          <h3 className="text-sm font-medium text-slate-400">Dette Totale</h3>
          <p className={`text-3xl font-bold mt-2 tabular-nums ${customer.totalDebt > 0 ? 'text-rose-400' : 'text-white'}`}>
            {customer.totalDebt.toLocaleString()} <span className="text-lg">MRU</span>
          </p>
        </div>
        <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400">Client depuis</h3>
            <p className="text-lg font-medium text-white">
              {new Date(customer.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Historique des transactions</h2>
        </div>
        <div className="divide-y divide-white/5">
          {customer.transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Aucune transaction trouvée.</div>
          ) : (
            [...customer.transactions].reverse().map((tx, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'increase' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {tx.type === 'increase' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {tx.type === 'increase' ? 'Augmentation de la dette' : 'Remboursement'}
                    </p>
                    <div className="flex gap-2 text-sm text-slate-500">
                      <span>{new Date(tx.date).toLocaleDateString('fr-FR')}</span>
                      {tx.note && <span>• {tx.note}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium tabular-nums ${tx.type === 'increase' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {tx.type === 'increase' ? '+' : '-'}{tx.amount.toLocaleString()} MRU
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">Solde: {tx.newTotalDebt.toLocaleString()} MRU</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
