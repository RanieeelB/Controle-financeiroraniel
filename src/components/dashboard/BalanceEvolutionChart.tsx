import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { BalanceEvolutionData } from '../../types/financial';

interface BalanceEvolutionChartProps {
  data: BalanceEvolutionData[];
}

export function BalanceEvolutionChart({ data }: BalanceEvolutionChartProps) {
  const formatCompactCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
    }

    return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="glass-card rounded-xl p-md sm:p-lg lg:col-span-2 flex flex-col h-full min-h-[260px] min-[390px]:min-h-[230px] sm:min-h-[300px] min-w-0">
      <div className="flex items-start justify-between gap-md mb-md">
        <h3 className="font-h2 text-[18px] sm:text-[24px] font-semibold text-on-background">Evolução do saldo</h3>
      </div>
      <div className="flex-1 w-full h-[200px] min-[390px]:h-[160px] sm:h-[250px] relative min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e676" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3b4a3d" opacity={0.5} />
            <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={formatCompactCurrency}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', borderColor: '#243041', borderRadius: '8px' }}
              itemStyle={{ color: '#00e676', fontWeight: 'bold' }}
              labelStyle={{ color: '#94A3B8' }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo']}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#00e676" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorBalance)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
