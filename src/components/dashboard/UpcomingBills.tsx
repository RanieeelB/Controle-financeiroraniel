import { Wifi, Zap, Landmark, Home, GraduationCap, MonitorPlay, ReceiptText, Check } from 'lucide-react';
import { useState } from 'react';
import type { FixedBill } from '../../types/financial';
import { payFixedBill } from '../../lib/financialActions';

interface UpcomingBillsProps {
  data: FixedBill[];
}

const iconMap: Record<string, React.ElementType> = {
  wifi: Wifi,
  zap: Zap,
  landmark: Landmark,
  home: Home,
  school: GraduationCap,
  subscriptions: MonitorPlay,
  receipt: ReceiptText,
};

export function UpcomingBills({ data }: { data: any[] }) {
  const [isPaying, setIsPaying] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="lg:col-span-2">
        <h3 className="font-h2 text-[24px] font-semibold text-on-background mb-md">Próximas contas</h3>
        <div className="glass-card rounded-xl p-xl flex items-center justify-center text-on-surface-variant">
          <p>Nenhuma conta fixa cadastrada ainda.</p>
        </div>
      </div>
    );
  }

  async function handlePay(bill: any) {
    if (isPaying) return;
    setIsPaying(bill.id);
    try {
      await payFixedBill(bill);
    } catch (error) {
      console.error('Error paying bill:', error);
    } finally {
      setIsPaying(null);
    }
  }

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
              <th className="p-md font-normal text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="text-[14px]">
            {data.map((bill) => {
              const IconComponent = iconMap[bill.icon] || ReceiptText;
              const status = bill.dynamicStatus || bill.status || 'pendente';
              const isAtrasado = status === 'atrasado';
              
              return (
                <tr key={bill.id} className={`border-b border-outline-variant/30 hover:bg-surface-variant/30 transition-colors ${isAtrasado ? 'bg-error-container/5' : ''}`}>
                  <td className="p-md flex items-center gap-sm">
                    <div className="p-xs bg-surface-container rounded">
                      <IconComponent className="text-on-surface-variant" size={16} />
                    </div>
                    {bill.description}
                  </td>
                  <td className="p-md font-numeral-lg text-[16px] font-medium">
                    R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`p-md ${isAtrasado ? 'text-error font-medium' : ''}`}>Dia {bill.due_day}</td>
                  <td className="p-md">
                    <div className="flex flex-col">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider text-center w-20 ${
                        status === 'pago' ? 'bg-primary-container/20 text-primary border border-primary/30' :
                        status === 'atrasado' ? 'bg-error-container text-on-error-container border border-error/50' :
                        'bg-surface-container-high text-on-surface-variant border border-outline-variant'
                      }`}>
                        {status === 'pago' ? 'Pago' : status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                      </span>
                      {isAtrasado && bill.daysOverdue > 0 && (
                        <span className="text-[10px] text-error mt-1">{bill.daysOverdue}d atraso</span>
                      )}
                    </div>
                  </td>
                  <td className="p-md text-center">
                    <button
                      onClick={() => handlePay(bill)}
                      disabled={status === 'pago' || isPaying === bill.id}
                      className={`p-1 rounded transition-all ${
                        status === 'pago' 
                          ? 'text-primary bg-primary/5 cursor-not-allowed' 
                          : 'text-on-surface-variant hover:text-primary hover:bg-primary/10'
                      }`}
                      title={status === 'pago' ? 'Conta já paga neste mês' : 'Pagar conta'}
                    >
                      {isPaying === bill.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : (
                        <Check size={18} />
                      )}
                    </button>
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
