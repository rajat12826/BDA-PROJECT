import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function Transactions() {
  const { data: transactions, isLoading } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-bold text-slate-800">Log of Stock Movements</h2>
         <p className="text-sm text-slate-500 italic">Pulled from inventory_transactions table</p>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">History (Before → After)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions?.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-slate-800 font-medium">{t.date}</span>
                </td>
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                  {t.productId}
                </td>
                <td className="px-6 py-4">
                  {t.type === 'IN' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <ArrowUpCircle size={16} /> IN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-lg">
                      <ArrowDownCircle size={16} /> OUT
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-lg">{t.quantity}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">{t.before}</span>
                    <span className="text-slate-300">→</span>
                    <span className="text-slate-900 font-bold">{t.after}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-500 italic text-sm">{t.note || '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
