import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, updateStock, addProduct, updateProduct, deleteProduct } from '../api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Plus, Search, ArrowUp, ArrowDown, Edit2, History, Trash2, Info } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ProductDialog from '../components/ProductDialog';
import ProductHistory from '../components/ProductHistory';
import StockModal from '../components/StockModal';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qtyChange, setQtyChange] = useState(0);

  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const [historyTarget, setHistoryTarget] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['alerts']);
      toast.success('Product deleted from HBase');
    }
  });

  const productSubmitMutation = useMutation({
    mutationFn: (data) => selectedProduct && isProductModalOpen 
      ? updateProduct(selectedProduct.id, data) 
      : addProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['alerts']);
      toast.success(selectedProduct ? 'Product metadata updated' : 'New product added to HBase');
      setIsProductModalOpen(false);
      setSelectedProduct(null);
    }
  });


  if (isLoading) return <LoadingSpinner />;

  const filteredProducts = products?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setSelectedProduct(null); setIsProductModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product & Info</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Attributes (Sparsity)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts?.map((p) => {
              const qty = parseInt(p.quantity || 0);
              const isLow = qty <= parseInt(p.threshold || 0);
              
              // Find dynamic attributes (anything not in standard list)
              const dynamicAttrs = Object.keys(p).filter(k => !['id', 'name', 'category', 'unit', 'price', 'quantity', 'threshold', 'lastUpdated'].includes(k));

              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{p.name || 'Unnamed'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">{p.id}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase font-bold">{p.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {dynamicAttrs.length > 0 ? dynamicAttrs.map(attr => (
                        <div key={attr} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded flex items-center gap-1 border border-indigo-100">
                          {attr}: {p[attr]}
                        </div>
                      )) : <span className="text-slate-300 text-xs italic">No extra attributes</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <span className={cn("text-lg font-bold", isLow ? "text-amber-600" : "text-blue-600")}>{qty}</span>
                         <button 
                           onClick={() => setHistoryTarget({ id: p.id, name: p.name, column: 'stock:quantity' })}
                           className="p-1 hover:bg-slate-100 rounded text-slate-400" title="View History (Time Travel)"
                         >
                            <History size={14} />
                         </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Threshold: {p.threshold}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    ${p.price || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setSelectedProduct(p); setIsStockModalOpen(true); }}
                        className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg" title="Inventory Transfer"
                      >
                        <ArrowRightLeft size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedProduct(p); setIsProductModalOpen(true); }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg" title="Edit Metadata"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => { if(confirm('Delete from HBase?')) deleteMutation.mutate(p.id); }}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg" title="Permanently Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stock Transfer Modal */}
      <StockModal 
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={selectedProduct}
      />

      {/* Product Add/Edit Modal */}
      <ProductDialog 
        isOpen={isProductModalOpen}
        initialData={selectedProduct}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={(data) => productSubmitMutation.mutate(data)}
      />

      {/* History Modal */}
      <ProductHistory 
        productId={historyTarget?.id}
        productName={historyTarget?.name}
        column={historyTarget?.column}
        onClose={() => setHistoryTarget(null)}
      />
    </div>
  );
}

// Icons and Helpers
function ArrowRightLeft({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" />
    </svg>
  );
}
function cn(...inputs) { return inputs.filter(Boolean).join(' '); }
