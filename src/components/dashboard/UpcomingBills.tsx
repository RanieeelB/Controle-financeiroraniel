import { Wifi, Zap, Landmark } from 'lucide-react';
import type { UpcomingBill } from '../../types/financial';

interface UpcomingBillsProps {
  data: UpcomingBill[];
}

const iconMap: Record<string, React.ElementType> = {
  wifi: Wifi,
  zap: Zap,
  landmark: Landmark,
};

export function UpcomingBills({ data }: UpcomingBillsProps) {
  return (
    <div className="lg:col-span-2">
      <h3 className="font-h2 text-[24px] font-semibold text-on-background mb-md">Próximas contas</h3>
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/50 text-on-surface-variant font-label-md text-[12px] uppercase tracking-wider">
              <th className="p-md font-normal">Descrição</th>
              <th className="p-md font-normal">Valor</th>
              <th className="p-md font-normal">Vencimento</th>
              <th className="p-md font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="text-[14px]">
            {data.map((bill) => {
              const IconComponent = iconMap[bill.icon] || Zap;
              
              return (
                <tr key={bill.id} className="border-b border-outline-variant/30 hover:bg-surface-variant/30 transition-colors">
                  <td className="p-md flex items-center gap-sm">
                    <div className="p-xs bg-surface-container rounded">
                      <IconComponent className="text-on-surface-variant" size={16} />
                    </div>
                    {bill.description}
                  </td>
                  <td className="p-md font-numeral-lg text-[16px] font-medium">
                    R$ {bill.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-md">{bill.dueDate}</td>
                  <td className="p-md">
                    <span className="px-2 py-1 rounded text-[12px] bg-surface-container-high text-on-surface-variant">
                      {bill.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
