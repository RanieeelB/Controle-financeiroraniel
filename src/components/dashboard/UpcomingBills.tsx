import { Wifi, Zap, Landmark, Home, GraduationCap, MonitorPlay, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { getCurrentMonthKey } from '../../lib/monthSelection';
import type { DynamicFixedBill } from '../../types/financial';
import { FixedBillPaymentModal } from '../finance/FixedBillPaymentModal';
import { FixedBillPaymentProgress } from '../finance/FixedBillPaymentProgress';

interface UpcomingBillsProps {
  data: DynamicFixedBill[];
  selectedMonthKey: string;
  onRefresh: () => Promise<unknown> | unknown;
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

export function UpcomingBills({ data, selectedMonthKey, onRefresh }: UpcomingBillsProps) {
  const [selectedPaymentBillId, setSelectedPaymentBillId] = useState<string | null>(null);
  const selectedPaymentBill = selectedPaymentBillId
    ? data.find(bill => bill.id === selectedPaymentBillId) ?? null
    : null;
  const isCurrentMonth = selectedMonthKey === getCurrentMonthKey();

  if (data.length === 0) {
    return (
      <div className="lg:col-span-2 min-w-0">
        <h3 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-background mb-md">Próximas contas</h3>
        <div className="glass-card rounded-xl p-lg sm:p-xl flex items-center justify-center text-on-surface-variant">
          <p>Nenhuma conta fixa cadastrada ainda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 min-w-0">
      <h3 className="font-h2 text-[20px] sm:text-[24px] font-semibold text-on-background mb-md">Próximas contas</h3>
      <div className="md:hidden space-y-sm">
        {data.map((bill) => {
          const IconComponent = iconMap[bill.icon] || ReceiptText;
          const status = bill.dynamicStatus || bill.status || 'pendente';
          const isAtrasado = status === 'atrasado';

          return (
            <article key={bill.id} className={`glass-card rounded-xl p-md min-w-0 ${isAtrasado ? 'border-error/40 bg-error-container/5' : ''}`}>
              <div className="flex items-start justify-between gap-md min-w-0">
                <div className="flex items-start gap-sm min-w-0">
                  <div className="p-xs bg-surface-container rounded shrink-0">
                    <IconComponent className="text-on-surface-variant" size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-on-surface truncate">{bill.description}</p>
                    <p className={`text-[12px] mt-0.5 ${isAtrasado ? 'text-error' : 'text-on-surface-variant'}`}>
                      Dia {bill.due_day}{isAtrasado && bill.daysOverdue > 0 ? ` • ${bill.daysOverdue}d atraso` : ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-md">
                <FixedBillPaymentProgress
                  bill={bill}
                  canAddPayment={isCurrentMonth && bill.remainingAmount > 0}
                  onAddPayment={() => setSelectedPaymentBillId(bill.id)}
                  compact
                />
              </div>
              <div className="flex items-end justify-between gap-md mt-sm">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${
                  status === 'pago' ? 'bg-primary-container/20 text-primary border-primary/30' :
                  status === 'atrasado' ? 'bg-error-container text-on-error-container border-error/50' :
                  'bg-surface-container-high text-on-surface-variant border-outline-variant'
                }`}>
                  {status === 'pago' ? 'Pago' : status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                </span>
              </div>
            </article>
          );
        })}
      </div>
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[680px] text-left border-collapse">
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
                    <td className="p-md min-w-[15rem]">
                      <FixedBillPaymentProgress
                        bill={bill}
                        canAddPayment={isCurrentMonth && bill.remainingAmount > 0}
                        onAddPayment={() => setSelectedPaymentBillId(bill.id)}
                        compact
                      />
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selectedPaymentBill && (
        <FixedBillPaymentModal
          bill={selectedPaymentBill}
          selectedMonthKey={selectedMonthKey}
          onClose={() => setSelectedPaymentBillId(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
