import { useState, useEffect } from 'react';
import { getProducts, getProductHistory, restoreProductVersion } from '../api';
import { Clock, ArrowLeft, Package, TrendingUp, TrendingDown, Minus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function TimeTravel() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    setHistoryLoading(true);
    try {
      const data = await getProductHistory(product.id);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRestore = async (version) => {
    if (!selectedProduct || !version) return;
    
    // Defensive check to ensure we have data to send
    const restoreData = {
      quantity: version.quantity || selectedProduct.quantity,
      price: version.price || selectedProduct.price
    };

    console.log('Travelling back to:', restoreData);
    setRestoringId(version.timestamp);
    
    try {
      await restoreProductVersion(selectedProduct.id, restoreData);
      
      // CRITICAL: Invalidate global caches so other pages sync immediately
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['alerts']);
      queryClient.invalidateQueries(['transactions']);

      toast.success('Successfully travelled back in time!');
      
      // Update the header state to reflect the "new" current state
      setSelectedProduct(prev => ({
        ...prev,
        ...restoreData
      }));

      // Refresh history to show new "current" version at the top
      const updatedHistory = await getProductHistory(selectedProduct.id);
      setHistory(updatedHistory);
    } catch (error) {
      toast.error('Failed to restore version');
      console.error('Restoration error:', error);
    } finally {
      setRestoringId(null);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading HBase Products...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {selectedProduct ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => setSelectedProduct(null)}
            className="flex items-center text-slate-500 hover:text-blue-600 font-medium transition-colors group"
          >
            <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Product List
          </button>

          <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                <Package size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedProduct.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                   <span className="text-slate-500 text-sm font-mono bg-slate-100 px-2 py-0.5 rounded">{selectedProduct.id}</span>
                   <span className="text-slate-400 text-sm">•</span>
                   <span className="text-slate-500 text-sm">{selectedProduct.category}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Live Stock</p>
                <p className="text-2xl font-mono font-bold text-slate-800 text-center">{selectedProduct.quantity}</p>
              </div>
              <div className="w-px h-10 bg-slate-200"></div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Live Price</p>
                <p className="text-2xl font-mono font-bold text-blue-600 text-center">${selectedProduct.price}</p>
              </div>
            </div>
          </div>

          <div className="relative">
            {historyLoading ? (
               <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-white rounded-xl border">
                  <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-sm">Querying HBase Versions...</p>
               </div>
            ) : history.length > 0 ? (
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-slate-200 before:to-transparent">
                {history.map((version, index) => {
                  const prevVersion = history[index + 1];
                  // Use 0 as fallback for parsing
                  const currentQty = parseInt(version.quantity || 0);
                  const priorQty = prevVersion ? parseInt(prevVersion.quantity || 0) : currentQty;
                  const qtyDiff = currentQty - priorQty;

                  const currentPrice = parseFloat(version.price || 0);
                  const priorPrice = prevVersion ? parseFloat(prevVersion.price || 0) : currentPrice;
                  const priceDiff = currentPrice - priorPrice;
                  
                  const isCurrent = index === 0;

                  return (
                    <div key={version.timestamp} className="relative flex items-center group">
                      <div className={`absolute left-0 w-10 h-10 bg-white border-2 ${isCurrent ? 'border-emerald-500' : 'border-blue-500'} rounded-full flex items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-md ${isCurrent ? 'shadow-emerald-100' : 'shadow-blue-100'}`}>
                        {isCurrent ? <Package size={16} className="text-emerald-500" /> : <Clock size={16} className="text-blue-500" />}
                      </div>
                      
                      <div className={`ml-16 bg-white rounded-xl border p-6 shadow-sm flex-1 hover:border-blue-300 transition-all ${isCurrent ? 'border-emerald-200 ring-4 ring-emerald-50/50' : ''}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="min-w-[200px]">
                            <span className={`text-[10px] font-bold ${isCurrent ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50'} px-2 py-0.5 rounded uppercase tracking-tighter`}>
                              {isCurrent ? 'Current Version (Live)' : `Version History #${history.length - index}`}
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 mt-1">{version.date}</h3>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">TS: {version.timestamp}</p>
                          </div>
                          
                          <div className="flex items-center gap-8 flex-1 justify-end">
                            <div className="flex gap-8 px-8">
                              <div className="space-y-1 min-w-[80px]">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Stock</p>
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-xl font-mono font-bold text-slate-700">{version.quantity || '??'}</span>
                                  {qtyDiff !== 0 && (
                                    <div className={`flex items-center ${qtyDiff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {qtyDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-1 min-w-[80px]">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Price</p>
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-xl font-mono font-bold text-slate-700">${version.price || '??'}</span>
                                  {priceDiff !== 0 && (
                                    <div className={`flex items-center ${priceDiff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {priceDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="w-[180px] flex justify-end">
                              {!isCurrent ? (
                                <button
                                  onClick={() => handleRestore(version)}
                                  disabled={restoringId !== null}
                                  className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn hover:shadow-lg hover:shadow-blue-200"
                                >
                                  {restoringId === version.timestamp ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  ) : (
                                    <RotateCcw size={14} className="group-hover/btn:-rotate-180 transition-transform duration-500" />
                                  )}
                                  Restore This State
                                </button>
                              ) : (
                                <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100 italic">
                                   <Minus size={14} /> Live Version
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                   <Clock size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-700">No Version History</h3>
                  <p className="text-slate-400 text-sm">This product hasn't been modified yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
          {products.map((product) => (
            <div 
              key={product.id} 
              onClick={() => handleSelectProduct(product)}
              className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-xl hover:border-blue-400 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-blue-100 transition-colors"></div>
              <div className="flex items-start justify-between mb-6 relative">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                  <Package size={24} />
                </div>
                <div className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                  {product.category}
                </div>
              </div>
              <h3 className="font-bold text-xl text-slate-800 group-hover:text-blue-600 transition-colors">{product.name}</h3>
              <p className="text-slate-400 text-sm font-mono mt-1">{product.id}</p>
              
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-50">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Stock</p>
                    <p className="font-bold text-slate-700">{product.quantity}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Price</p>
                    <p className="font-bold text-blue-600">${product.price}</p>
                  </div>
                </div>
                <div className="text-blue-600 font-bold text-xs flex items-center bg-blue-50 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  Time Travel <Clock size={14} className="ml-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
