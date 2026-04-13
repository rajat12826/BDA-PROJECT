import { useQuery } from '@tanstack/react-query';
import { getRawData } from '../api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useState } from 'react';
import { Database, Search, FileJson, Code } from 'lucide-react';

const tables = ['inventory_products', 'inventory_transactions', 'inventory_alerts'];

export default function RawExplorer() {
  const [selectedTable, setSelectedTable] = useState(tables[0]);
  const { data: rawData, isLoading, refetch } = useQuery({
    queryKey: ['raw', selectedTable],
    queryFn: () => getRawData(selectedTable)
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">HBase Raw Data Explorer</h2>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border">
          {tables.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTable(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedTable === t
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
          <Database size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-blue-900">Big Data Visualization Concept</h4>
          <p className="text-sm text-blue-700 leading-relaxed">
            Unlike SQL tables which store fixed rows, HBase stores <strong>Cell-Based Key-Value pairs</strong>.
            Below you can see the absolute raw JSON structure as it exists in the HBase REST server.
            Notice how every cell has its own timestamp and coordinates.
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-700 uppercase p-2 tracking-widest text-xs flex items-center gap-2">
                <FileJson size={14} /> Total Cells: {rawData?.count}
              </h3>
            </div>

            <div className="glass rounded-3xl p-6 h-[600px] overflow-y-auto space-y-2">
              {rawData?.rawCells?.slice(0, 50).map((cell, idx) => (
                <div key={idx} className="bg-white/50 border border-white p-3 rounded-xl text-[10px] font-mono hover:bg-white transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-blue-600 font-bold uppercase">{cell.column}</span>
                    <span className="text-slate-400">{new Date(cell.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 bg-slate-100 px-1 rounded">Row: {cell.key}</span>
                    <span className="text-emerald-600 font-bold">Val: {cell.$}</span>
                  </div>
                </div>
              ))}
              {rawData?.count > 50 && (
                <p className="text-center text-xs text-slate-400 py-4 italic">Showing first 50 cells for performance...</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 uppercase p-2 tracking-widest text-xs flex items-center gap-2">
              <Code size={14} /> Raw Stargate JSON (Standard Format)
            </h3>
            <div className="bg-slate-900 text-blue-300 p-8 rounded-3xl h-[600px] overflow-auto text-xs font-mono shadow-inner border border-black scrollbar-hide">
              <pre>{JSON.stringify(rawData?.rawCells?.slice(0, 5), null, 2)}</pre>
              <div className="mt-4 pt-4 border-t border-white/10 text-white/40">
                {`// ... and ${rawData?.count - 5} more records`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
