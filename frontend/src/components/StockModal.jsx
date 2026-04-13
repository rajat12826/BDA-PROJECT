import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStock } from '../api';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

export default function StockModal({ isOpen, onClose, product }) {
  const [qtyChange, setQtyChange] = useState(0);
  const queryClient = useQueryClient();

  const stockMutation = useMutation({
    mutationFn: (changeType) => updateStock(product.id, { quantity: parseInt(qtyChange), changeType }),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['transactions']);
      toast.success(`Stock level updated for ${product.name}`);
      setQtyChange(0);
      onClose();
    },
    onError: (err) => {
      toast.error('Failed to update stock: ' + err.message);
    }
  });

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass w-full max-w-md p-8 rounded-3xl space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Adjust Stock</h3>
            <p className="text-slate-500 mt-1">{product.name} ({product.id})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Inventory</span>
             <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{product.quantity} units</h4>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-600">Change Amount</label>
            <input 
              type="number" 
              value={qtyChange}
              onChange={(e) => setQtyChange(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              placeholder="Enter units..."
              className="w-full px-4 py-4 rounded-xl border border-slate-200 text-center text-2xl font-black text-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button 
              onClick={() => stockMutation.mutate('IN')}
              disabled={qtyChange <= 0 || stockMutation.isLoading}
              className="group flex flex-col items-center gap-2 p-5 rounded-3xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 border border-emerald-100 shadow-sm hover:shadow-lg hover:shadow-emerald-200"
            >
              <div className="p-3 bg-emerald-100 group-hover:bg-emerald-500 rounded-2xl transition-colors">
                 <ArrowUp size={24} />
              </div>
              <span className="font-bold text-sm uppercase">Stock IN</span>
            </button>
            <button 
              onClick={() => stockMutation.mutate('OUT')}
              disabled={qtyChange <= 0 || stockMutation.isLoading || (product.quantity < qtyChange)}
              className="group flex flex-col items-center gap-2 p-5 rounded-3xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50 border border-rose-100 shadow-sm hover:shadow-lg hover:shadow-rose-200"
            >
              <div className="p-3 bg-rose-100 group-hover:bg-rose-500 rounded-2xl transition-colors">
                 <ArrowDown size={24} />
              </div>
              <span className="font-bold text-sm uppercase">Stock OUT</span>
            </button>
          </div>
          
          {product.quantity < qtyChange && qtyChange > 0 && (
             <p className="text-[10px] text-rose-500 text-center font-bold uppercase tracking-tight">Insufficient Stock for OUT movement</p>
          )}
        </div>

        <button 
          onClick={onClose} 
          className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
