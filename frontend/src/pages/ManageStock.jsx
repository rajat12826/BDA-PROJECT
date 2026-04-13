import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Truck, Search, PlusCircle, MinusCircle, Package, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import StockModal from '../components/StockModal';

export default function ManageStock() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: products, isLoading } = useQuery({ 
    queryKey: ['products'], 
    queryFn: getProducts 
  });

  if (isLoading) return <LoadingSpinner />;

  const filteredProducts = products?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdjustment = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Stock Manager</h2>
          <p className="text-slate-500">Perform manual inventory movements and adjustments</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search items..." 
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts?.map((product) => {
          const isLow = parseInt(product.quantity) <= parseInt(product.threshold);
          
          return (
            <div key={product.id} className="glass group p-6 rounded-[2.5rem] border border-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300">
               <div className="flex justify-between items-start mb-6">
                  <div className={clsx(
                    "p-4 rounded-3xl",
                    isLow ? "bg-amber-100 text-amber-600" : "bg-blue-50 text-blue-600"
                  )}>
                    <Package size={28} />
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">{product.category}</span>
                    <span className="block text-xl font-black text-slate-800 tracking-tighter">${product.price}</span>
                  </div>
               </div>

               <div className="space-y-1 mb-6">
                  <h3 className="text-lg font-bold text-slate-800 leading-none">{product.name}</h3>
                  <p className="text-xs font-mono text-slate-400">{product.id}</p>
               </div>

               <div className="flex items-center gap-4 mb-8">
                  <div className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stock Level</span>
                    <span className={clsx(
                       "text-2xl font-black tracking-tighter",
                       isLow ? "text-amber-600" : "text-slate-800"
                    )}>
                      {product.quantity} <span className="text-xs font-medium text-slate-400">units</span>
                    </span>
                    {isLow && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  </div>
                  <div className="flex-1 p-4 rounded-2xl bg-white border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Safety Limit</span>
                    <span className="text-2xl font-black text-slate-400 tracking-tighter">
                      {product.threshold}
                    </span>
                  </div>
               </div>

               <button 
                  onClick={() => openAdjustment(product)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10"
               >
                  <ArrowRightLeft size={18} />
                  Process Movement
               </button>
            </div>
          );
        })}
      </div>

      <StockModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
