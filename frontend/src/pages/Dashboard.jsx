import { useQuery } from '@tanstack/react-query';
import { getProducts, getAlerts, getTransactions } from '../api';
import KPICards from '../components/KPICards';
import StockChart from '../components/StockChart';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Dashboard() {
  const { data: products, isLoading: pLoading } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const { data: alerts, isLoading: aLoading } = useQuery({ queryKey: ['alerts'], queryFn: getAlerts });
  const { data: transactions, isLoading: tLoading } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });

  if (pLoading || aLoading || tLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <KPICards products={products} alerts={alerts} transactions={transactions} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Stock Distribution</h2>
              <p className="text-sm text-slate-500">Current levels for top products</p>
            </div>
          </div>
          <StockChart data={products} />
        </div>

        <div className="glass p-8 rounded-3xl">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Alerts</h2>
          <div className="space-y-4">
            {alerts?.slice(0, 5).map((alert) => (
              <div key={alert.productId} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100/50">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${alert.status === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{alert.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Qty: <span className="font-bold text-slate-700">{alert.currentQty}</span> / Threshold: {alert.threshold}
                  </p>
                </div>
              </div>
            ))}
            {(!alerts || alerts.length === 0) && (
              <div className="text-center py-8 text-slate-400 italic text-sm">No active alerts</div>
            )}
          </div>
          {alerts?.length > 5 && (
            <button className="w-full mt-4 text-sm text-blue-600 font-medium hover:underline">View all alerts</button>
          )}
        </div>
      </div>
    </div>
  );
}
