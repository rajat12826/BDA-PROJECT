import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

const productSchema = z.object({
  id: z.string().min(3, "ID must be at least 3 characters").max(20),
  name: z.string().min(2, "Name is too short"),
  category: z.string().min(2, "Category is required"),
  unit: z.string().default('pcs'),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  quantity: z.preprocess((val) => Number(val), z.number().min(0)),
  threshold: z.preprocess((val) => Number(val), z.number().min(0)),
  attributes: z.array(z.object({
    key: z.string().min(1, "Key required"),
    value: z.string().min(1, "Value required")
  })).optional()
});

export default function ProductDialog({ isOpen, onClose, onSubmit, initialData }) {
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || { id: '', name: '', category: '', unit: 'pcs', price: '0.00', quantity: 0, threshold: 0, attributes: [] }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes"
  });

  useEffect(() => {
    if (initialData) {
      // Flatten attributes if coming from HBase-style object
      const attributes = Object.keys(initialData)
        .filter(k => !['id', 'name', 'category', 'unit', 'price', 'quantity', 'threshold', 'lastUpdated'].includes(k))
        .map(k => ({ key: k, value: initialData[k] }));
      
      reset({ ...initialData, attributes });
    } else {
      reset({ id: '', name: '', category: '', unit: 'pcs', price: '0.00', quantity: 0, threshold: 0, attributes: [] });
    }
  }, [initialData, reset]);

  if (!isOpen) return null;

  const onFormSubmit = (data) => {
    // Convert array back to object for HBase
    const formattedData = { ...data };
    if (data.attributes) {
      formattedData.attributes = data.attributes.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
    }
    onSubmit(formattedData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass w-full max-w-2xl p-8 rounded-3xl space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-slate-800">{initialData ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Product ID</label>
              <input 
                {...register('id')} 
                disabled={!!initialData}
                placeholder="PROD001"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
              />
              {errors.id && <p className="text-red-500 text-xs">{errors.id.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Product Name</label>
              <input 
                {...register('name')} 
                placeholder="Standard Widget"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Category</label>
              <input 
                {...register('category')} 
                placeholder="Hardware"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Price ($)</label>
              <input 
                {...register('price')} 
                placeholder="49.99"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Threshold</label>
              <input 
                type="number"
                {...register('threshold')} 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Quantity</label>
              <input 
                type="number"
                {...register('quantity')} 
                disabled={!!initialData}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-700">Dynamic Attributes (BDA Sparsity Demo)</h4>
              <button 
                type="button"
                onClick={() => append({ key: '', value: '' })}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={14} /> Add Attribute
              </button>
            </div>
            
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 animate-in slide-in-from-left-2 transition-all">
                  <input 
                    {...register(`attributes.${index}.key`)}
                    placeholder="e.g. Color"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
                  />
                  <input 
                    {...register(`attributes.${index}.value`)}
                    placeholder="e.g. Red"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              {initialData ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
