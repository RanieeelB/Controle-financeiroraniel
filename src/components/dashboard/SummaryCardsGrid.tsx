import { Wallet, ArrowDownToLine, ArrowUpRight, PiggyBank, CreditCard, ReceiptText } from 'lucide-react';
import type { SummaryCards } from '../../types/financial';

interface SummaryCardsGridProps {
  data: SummaryCards;
}

export function SummaryCardsGrid({ data }: SummaryCardsGridProps) {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm sm:gap-md">
      {/* Saldo Atual */}
      <div className="glass-card-premium rounded-xl p-md sm:p-lg flex flex-col gap-sm min-w-0 sm:col-span-2 lg:col-span-1">
        <div className="flex justify-between items-start gap-md">
          <span className="text-on-surface-variant font-label-md text-[12px] sm:text-[14px] uppercase tracking-wider">Saldo atual</span>
          <Wallet className="text-primary shrink-0" size={22} />
        </div>
        <div className="flex items-baseline gap-sm min-w-0">
          <span className="font-numeral-lg text-[32px] min-[390px]:text-[36px] sm:text-[40px] xl:text-[48px] font-bold text-on-background leading-none break-words">
            R$ {fmt(data.currentBalance)}
          </span>
        </div>
      </div>

      {/* Entradas do mês */}
      <div className="glass-card rounded-xl p-md sm:p-lg flex flex-col gap-sm min-w-0">
        <div className="flex justify-between items-start gap-md">
          <span className="text-on-surface-variant font-label-md text-[12px] sm:text-[14px] uppercase tracking-wider">Entradas do mês</span>
          <ArrowDownToLine className="text-primary shrink-0" size={22} />
        </div>
        <div>
          <span className="font-numeral-lg text-[24px] min-[390px]:text-[26px] sm:text-[32px] font-semibold text-on-background leading-none break-words">
            R$ {fmt(data.totalIncome)}
          </span>
        </div>
      </div>

      {/* Total Gastos */}
      <div className="glass-card rounded-xl p-md sm:p-lg flex flex-col gap-sm border-l-2 border-l-tertiary-container min-w-0">
        <div className="flex justify-between items-start gap-md">
          <span className="text-on-surface-variant font-label-md text-[12px] sm:text-[14px] uppercase tracking-wider">Gastos do mês</span>
          <ArrowUpRight className="text-tertiary-container shrink-0" size={22} />
        </div>
        <div>
          <span className="font-numeral-lg text-[24px] min-[390px]:text-[26px] sm:text-[32px] font-semibold text-tertiary-container leading-none break-words">
            R$ {fmt(data.totalExpense)}
          </span>
        </div>
      </div>

      {/* Sobra Prevista */}
      <div className="glass-card rounded-xl p-md sm:p-lg flex flex-col gap-sm min-w-0">
        <div className="flex justify-between items-start gap-md">
          <span className="text-on-surface-variant font-label-md text-[12px] sm:text-[14px] uppercase tracking-wider">Sobra prevista</span>
          <PiggyBank className="text-secondary shrink-0" size={22} />
        </div>
        <div>
          <span className="font-numeral-lg text-[24px] min-[390px]:text-[26px] sm:text-[32px] font-semibold text-on-background leading-none break-words">
            R$ {fmt(data.projectedBalance)}
          </span>
        </div>
      </div>

      {/* Faturas abertas */}
      <div className="glass-card rounded-xl p-md sm:p-lg flex flex-col gap-sm min-w-0">
        <div className="flex justify-between items-start gap-md">
          <span className="text-on-surface-variant font-label-md text-[12px] sm:text-[14px] uppercase tracking-wider">Faturas abertas</span>
          <CreditCard className="text-on-surface-variant shrink-0" size={22} />
        </div>
        <div>
          <span className="font-numeral-lg text-[24px] min-[390px]:text-[26px] sm:text-[32px] font-semibold text-on-background leading-none break-words">
            R$ {fmt(data.openInvoices)}
          </span>
        </div>
      </div>

      {/* Contas fixas */}
      <div className="glass-card rounded-xl p-md sm:p-lg flex flex-col gap-sm min-w-0">
        <div className="flex justify-between items-start gap-md">
          <span className="text-on-surface-variant font-label-md text-[12px] sm:text-[14px] uppercase tracking-wider">Contas fixas</span>
          <ReceiptText className="text-on-surface-variant shrink-0" size={22} />
        </div>
        <div>
          <span className="font-numeral-lg text-[24px] min-[390px]:text-[26px] sm:text-[32px] font-semibold text-on-background leading-none break-words">
            R$ {fmt(data.fixedBillsTotal)}
          </span>
        </div>
      </div>
    </section>
  );
}
