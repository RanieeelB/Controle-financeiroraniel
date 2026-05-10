import { Wallet, ArrowDownToLine, ArrowUpRight, PiggyBank, CreditCard, ReceiptText } from 'lucide-react';
import type { SummaryCards } from '../../types/financial';

interface SummaryCardsGridProps {
  data: SummaryCards;
}

export function SummaryCardsGrid({ data }: SummaryCardsGridProps) {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const cardClass = 'rounded-xl p-sm min-[390px]:p-md sm:p-lg flex flex-col gap-xs sm:gap-sm min-h-[112px] sm:min-h-[136px] min-w-0';
  const labelClass = 'text-on-surface-variant font-label-md text-[10px] min-[390px]:text-[11px] sm:text-[12px] uppercase tracking-wider leading-tight';
  const valueClass = 'font-numeral-lg text-[18px] min-[360px]:text-[20px] min-[390px]:text-[22px] sm:text-[28px] lg:text-[30px] xl:text-[22px] 2xl:text-[26px] font-semibold leading-tight break-words';

  return (
    <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-sm sm:gap-md min-w-0">
      {/* Saldo Atual */}
      <div className={`glass-card-premium ${cardClass} lg:col-span-1`}>
        <div className="flex justify-between items-start gap-sm">
          <span className={labelClass}>Saldo atual</span>
          <Wallet className="text-primary shrink-0" size={20} />
        </div>
        <div className="flex items-baseline gap-sm min-w-0">
          <span className={`${valueClass} text-on-background font-bold`}>
            R$ {fmt(data.currentBalance)}
          </span>
        </div>
      </div>

      {/* Entradas do mês */}
      <div className={`glass-card ${cardClass}`}>
        <div className="flex justify-between items-start gap-sm">
          <span className={labelClass}>Entradas do mês</span>
          <ArrowDownToLine className="text-primary shrink-0" size={20} />
        </div>
        <div>
          <span className={`${valueClass} text-on-background`}>
            R$ {fmt(data.totalIncome)}
          </span>
        </div>
      </div>

      {/* Total Gastos */}
      <div className={`glass-card border-l-2 border-l-tertiary-container ${cardClass}`}>
        <div className="flex justify-between items-start gap-sm">
          <span className={labelClass}>Gastos do mês</span>
          <ArrowUpRight className="text-tertiary-container shrink-0" size={20} />
        </div>
        <div>
          <span className={`${valueClass} text-tertiary-container`}>
            R$ {fmt(data.totalExpense)}
          </span>
        </div>
      </div>

      {/* Sobra Prevista */}
      <div className={`glass-card ${cardClass}`}>
        <div className="flex justify-between items-start gap-sm">
          <span className={labelClass}>Sobra prevista</span>
          <PiggyBank className="text-secondary shrink-0" size={20} />
        </div>
        <div>
          <span className={`${valueClass} text-on-background`}>
            R$ {fmt(data.projectedBalance)}
          </span>
        </div>
      </div>

      {/* Faturas abertas */}
      <div className={`glass-card ${cardClass}`}>
        <div className="flex justify-between items-start gap-sm">
          <span className={labelClass}>Faturas abertas</span>
          <CreditCard className="text-on-surface-variant shrink-0" size={20} />
        </div>
        <div>
          <span className={`${valueClass} text-on-background`}>
            R$ {fmt(data.openInvoices)}
          </span>
        </div>
      </div>

      {/* Contas fixas */}
      <div className={`glass-card ${cardClass}`}>
        <div className="flex justify-between items-start gap-sm">
          <span className={labelClass}>Contas fixas</span>
          <ReceiptText className="text-on-surface-variant shrink-0" size={20} />
        </div>
        <div>
          <span className={`${valueClass} text-on-background`}>
            R$ {fmt(data.fixedBillsTotal)}
          </span>
        </div>
      </div>
    </section>
  );
}
