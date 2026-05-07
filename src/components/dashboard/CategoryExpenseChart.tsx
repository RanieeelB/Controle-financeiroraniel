import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { CategoryExpenseData } from '../../types/financial';

interface CategoryExpenseChartProps {
  data: CategoryExpenseData[];
}

export function CategoryExpenseChart({ data }: CategoryExpenseChartProps) {
  return (
    <div className="glass-card rounded-xl p-lg flex flex-col items-center justify-center flex-1 h-full min-h-[250px]">
      <h3 className="font-h2 text-[24px] font-semibold text-on-background w-full text-left mb-md">Gastos por categoria</h3>
      
      <div className="relative w-40 h-40 flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', borderColor: '#243041', borderRadius: '8px' }}
              itemStyle={{ fontWeight: 'bold' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Gasto']}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <PieChartIcon className="text-on-surface-variant" size={24} />
        </div>
      </div>

      <div className="flex gap-sm mt-md w-full justify-center text-[12px]">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
