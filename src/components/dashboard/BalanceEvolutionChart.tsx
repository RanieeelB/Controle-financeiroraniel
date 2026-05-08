import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import type { BalanceEvolutionData } from '../../types/financial';

interface BalanceEvolutionChartProps {
  data: BalanceEvolutionData[];
}

export function BalanceEvolutionChart({ data }: BalanceEvolutionChartProps) {
  return (
    <div className="glass-card rounded-xl p-lg lg:col-span-2 flex flex-col h-full min-h-[300px]">
      <h3 className="font-h2 text-[24px] font-semibold text-on-background mb-md">Evolução do saldo</h3>
      <div className="flex-1 w-full h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e676" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3b4a3d" opacity={0.5} />
            <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
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
