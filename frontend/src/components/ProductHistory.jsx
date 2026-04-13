import { useQuery } from '@tanstack/react-query';
import { getProductHistory } from '../api';
import { LoadingSpinner } from './LoadingSpinner';
import { X, Calendar, Clock, ArrowRight } from 'lucide-react';

export default function ProductHistory({ productId, productName, column, onClose }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['history', productId, column],
    queryFn: () => getProductHistory(productId, column),
    enabled: !!productId && !!column
  });

  if (!productId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass w-full max-w-lg p-8 rounded-3xl space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 border-l-8 border-l-blue-500">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Time-Travel: Cell History</h3>
            <p className="text-sm text-slate-500 mt-1">{productName} • <span className="font-mono text-blue-600">{column}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
             <p className="text-xs text-blue-700 leading-relaxed font-medium">
               <span className="font-bold">BDA Insight:</span> This view shows multiple versions of the same cell stored in HBase. Unlike SQL databases that overwrite values, HBase keeps historical versions (configured to 10 in this lab).
             </p>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {history?.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 relative group">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 text-xs font-bold">
                       {history.length - idx}
                    </div>
                    <div>
                       <span className="text-lg font-bold text-slate-800">{entry.value}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                     <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Calendar size={10} /> {entry.date.split(',')[0]}
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                        <Clock size={10} /> {entry.date.split(',')[1]}
                     </div>
                  </div>

                  {idx < history.length - 1 && (
                     <div className="absolute -bottom-3 left-8 w-0.5 h-3 bg-slate-100 z-0"></div>
                  )}
                </div>
              ))}
              {(!history || history.length === 0) && (
                <p className="text-center py-8 text-slate-400 italic">No history available</p>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all"
        >
          Close History
        </button>
      </div>
    </div>
  );
}
