import { Package, TrendingUp, AlertTriangle, ArrowRightLeft } from 'lucide-react';

export default function KPICards({ products, alerts, transactions }) {
  const stats = [
    { 
      label: 'Total Products', 
      value: products?.length || 0, 
      icon: Package, 
      color: 'bg-blue-500', 
      detail: 'Registered items' 
    },
    { 
      label: 'Stock Movements', 
      value: transactions?.length || 0, 
      icon: ArrowRightLeft, 
      color: 'bg-emerald-500', 
      detail: 'Last 24 hours' 
    },
    { 
      label: 'Low Stock', 
      value: alerts?.length || 0, 
      icon: AlertTriangle, 
      color: 'bg-amber-500', 
      detail: 'Threshold reached' 
    },
    { 
      label: 'Total Qty', 
      value: products?.reduce((acc, p) => acc + parseInt(p.quantity || 0), 0) || 0, 
      icon: TrendingUp, 
      color: 'bg-indigo-500', 
      detail: 'Total units in stock' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="glass p-6 rounded-2xl card-hover relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-[0.03] rounded-bl-[100px] border-l border-b border-black/5 transition-all duration-300 group-hover:scale-150`}></div>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.color} text-white shadow-lg shadow-${stat.color.split('-')[1]}-200`}>
              <stat.icon size={24} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
