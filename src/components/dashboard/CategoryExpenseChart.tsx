import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LabelList } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { CategoryExpenseData } from '../../types/financial';

interface CategoryExpenseChartProps {
  data: CategoryExpenseData[];
}

export function CategoryExpenseChart({ data }: CategoryExpenseChartProps) {
  const hasData = data.length > 0;
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map(item => ({
    ...item,
    percentage: totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0,
  }));

  return (
    <div className="glass-card rounded-xl p-md sm:p-lg flex flex-col overflow-hidden min-w-0">
      <h3 className="font-h2 text-[18px] sm:text-[24px] font-semibold text-on-background mb-md">Gastos por categoria</h3>
      
      <div className="relative flex items-center justify-center h-[150px] min-[390px]:h-[145px] sm:h-[180px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius="52%"
                outerRadius="72%"
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                <LabelList
                  dataKey="percentage"
                  position="outside"
                  className="fill-on-surface text-[11px] font-semibold"
                  formatter={(value) => {
                    const percentage = Number(value);
                    return percentage >= 8 ? `${percentage}%` : '';
                  }}
                />
                {chartData.map((entry, index) => (
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
          <div className="w-[140px] h-[140px] sm:w-[150px] sm:h-[150px] rounded-full border-4 border-dashed border-outline-variant flex items-center justify-center">
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
        {chartData.length > 0 ? chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-xs min-w-0">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
            <span className="truncate">{item.name} {item.percentage}%</span>
          </div>
        )) : (
          <span className="text-on-surface-variant">Sem dados de gastos</span>
        )}
      </div>
    </div>
  );
}
