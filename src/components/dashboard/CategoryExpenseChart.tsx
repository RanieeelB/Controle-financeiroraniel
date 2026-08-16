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

      {hasData ? (
        <>
          <div className="relative w-full h-[150px] min-[390px]:h-[145px] sm:h-[180px] flex items-center justify-center">
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

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <PieChartIcon className="text-on-surface-variant" size={20} />
              <span className="font-numeral-lg text-[12px] text-on-surface-variant mt-xs">
                {Math.round(totalValue).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-md w-full text-[12px]">
            {chartData.map(item => (
              <li key={item.name} className="flex items-center justify-between gap-sm min-w-0">
                <span className="flex items-center gap-xs min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate text-on-surface">{item.name}</span>
                </span>
                <span className="font-numeral-lg text-on-surface-variant whitespace-nowrap">
                  R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center gap-md text-center text-on-surface-variant">
          <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center">
            <PieChartIcon size={28} />
          </div>
          <p className="font-body-md text-[14px]">Sem gastos categorizados neste mês.</p>
        </div>
      )}
    </div>
  );
}
