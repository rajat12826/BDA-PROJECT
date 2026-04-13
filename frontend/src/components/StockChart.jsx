import { BarChart as BChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function StockChart({ data = [] }) {
  const chartData = data
    .slice(0, 8)
    .map(p => ({
      name: p.name,
      qty: parseInt(p.quantity || 0),
      threshold: parseInt(p.threshold || 0)
    }));

  return (
    <div className="h-[400px] w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            interval={0}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="qty" radius={[10, 10, 0, 0]} barSize={40}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.qty <= entry.threshold ? '#f59e0b' : '#3b82f6'} 
              />
            ))}
          </Bar>
        </BChart>
      </ResponsiveContainer>
    </div>
  );
}
