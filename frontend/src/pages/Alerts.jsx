import { useQuery } from '@tanstack/react-query';
import { getAlerts } from '../api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertCircle, AlertTriangle, CheckCircle, PackageSearch } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import StockModal from '../components/StockModal';

export default function Alerts() {
  const { data: alerts, isLoading } = useQuery({ queryKey: ['alerts'], queryFn: getAlerts });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) return <LoadingSpinner />;

  const openRestock = (alert) => {
    // Map alert data back to product structure for the modal
    setSelectedProduct({
      id: alert.productId,
      name: alert.name,
      quantity: alert.currentQty,
      threshold: alert.threshold
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Critical Stock Levels</h2>
        <p className="text-slate-500">Products currently below their safety threshold</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {alerts?.map((alert) => (
           <div key={alert.productId} className={`glass group p-8 rounded-[2.5rem] border-l-[12px] transition-all hover:scale-[1.02] ${alert.status === 'CRITICAL' ? 'border-l-red-500 bg-red-50/10 shadow-red-100/50' : 'border-l-amber-500 bg-amber-50/10 shadow-amber-100/50'} card-hover`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${alert.status === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                   {alert.status === 'CRITICAL' ? <AlertCircle size={28}/> : <AlertTriangle size={28}/>}
                </div>
                <div className="text-right">
                   <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest leading-none ${alert.status === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                     {alert.status}
                   </span>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-black text-slate-800 text-xl leading-tight mb-2">{alert.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{alert.productId}</p>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase">Current Qty</span>
                    <span className="font-black text-2xl text-slate-800 tracking-tighter">{alert.currentQty} <span className="text-xs font-medium">units</span></span>
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                       <span className="text-slate-400">Target Level: {alert.threshold}</span>
                       <span className={alert.status === 'CRITICAL' ? 'text-red-500' : 'text-amber-600'}>
                         Shortfall: {alert.threshold - alert.currentQty}
                       </span>
                    </div>
                    <div className="w-full bg-slate-200/50 h-3 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-1000 ease-out ${alert.status === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`}
                         style={{ width: `${Math.max(5, (alert.currentQty / alert.threshold) * 100)}%` }}
                        ></div>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => openRestock(alert)}
                className="mt-8 w-full py-4 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-all shadow-sm group-hover:shadow-lg"
              >
                 <PackageSearch size={16}/>
                 Set Restock Quantity
                 <ArrowRight size={14} className="ml-1"/>
              </button>
           </div>
         ))}

         {(!alerts || alerts.length === 0) && (
           <div className="col-span-full glass p-20 flex flex-col items-center justify-center text-center space-y-6 rounded-[3rem]">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce duration-1000">
                 <CheckCircle size={48}/>
              </div>
              <div className="max-w-xs">
                <h3 className="text-2xl font-black text-slate-800">Zero Criticals</h3>
                <p className="text-slate-500 font-medium">Your inventory levels are healthy across all product categories.</p>
              </div>
           </div>
         )}
      </div>

      <StockModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}

function ArrowRight({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
