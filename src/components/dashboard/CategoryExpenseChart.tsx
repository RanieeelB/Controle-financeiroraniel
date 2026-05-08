import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { CategoryExpenseData } from '../../types/financial';

interface CategoryExpenseChartProps {
  data: CategoryExpenseData[];
}

export function CategoryExpenseChart({ data }: CategoryExpenseChartProps) {
  const hasData = data.length > 0;

  return (
    <div className="glass-card rounded-xl p-lg flex flex-col overflow-hidden">
      <h3 className="font-h2 text-[24px] font-semibold text-on-background mb-md">Gastos por categoria</h3>
      
      <div className="relative flex items-center justify-center" style={{ height: 180 }}>
        {hasData ? (
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={data}
                innerRadius={55}
                outerRadius={75}
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
        ) : (
          <div className="w-[150px] h-[150px] rounded-full border-4 border-dashed border-outline-variant flex items-center justify-center">
            <PieChartIcon className="text-outline-variant" size={32} />
          </div>
        )}

        {hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <PieChartIcon className="text-on-surface-variant" size={20} />
          </div>
        )}
      </div>

      <div className="flex gap-sm mt-md w-full justify-center text-[12px] flex-wrap">
        {data.length > 0 ? data.map((item) => (
          <div key={item.name} className="flex items-center gap-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
            {item.name}
          </div>
        )) : (
          <span className="text-on-surface-variant">Sem dados de gastos</span>
        )}
      </div>
    </div>
  );
}
