import { Wallet, ArrowDownToLine, ArrowUpRight, PiggyBank, CreditCard, ReceiptText } from 'lucide-react';
import type { SummaryCards } from '../../types/financial';

interface SummaryCardsGridProps {
  data: SummaryCards;
}

export function SummaryCardsGrid({ data }: SummaryCardsGridProps) {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
      {/* Saldo Livre */}
      <div className="glass-card-premium rounded-xl p-lg flex flex-col gap-sm">
        <div className="flex justify-between items-start">
          <span className="text-on-surface-variant font-label-md text-[14px] uppercase tracking-wider">Saldo livre</span>
          <Wallet className="text-primary" size={24} />
        </div>
        <div className="flex items-baseline gap-sm">
          <span className="font-numeral-lg text-[48px] font-bold text-on-background leading-none">
            R$ {fmt(data.freeBalance)}
          </span>
        </div>
      </div>

      {/* Recebido no mês */}
      <div className="glass-card rounded-xl p-lg flex flex-col gap-sm">
        <div className="flex justify-between items-start">
          <span className="text-on-surface-variant font-label-md text-[14px] uppercase tracking-wider">Recebido no mês</span>
          <ArrowDownToLine className="text-primary" size={24} />
        </div>
        <div>
          <span className="font-numeral-lg text-[32px] font-semibold text-on-background leading-none">
            R$ {fmt(data.totalIncome)}
          </span>
        </div>
      </div>

      {/* Total Gastos */}
      <div className="glass-card rounded-xl p-lg flex flex-col gap-sm border-l-2 border-l-tertiary-container">
        <div className="flex justify-between items-start">
          <span className="text-on-surface-variant font-label-md text-[14px] uppercase tracking-wider">Gastos do mês</span>
          <ArrowUpRight className="text-tertiary-container" size={24} />
        </div>
        <div>
          <span className="font-numeral-lg text-[32px] font-semibold text-tertiary-container leading-none">
            R$ {fmt(data.totalExpense)}
          </span>
        </div>
      </div>

      {/* Guardado */}
      <div className="glass-card rounded-xl p-lg flex flex-col gap-sm">
        <div className="flex justify-between items-start">
          <span className="text-on-surface-variant font-label-md text-[14px] uppercase tracking-wider">Guardado</span>
          <PiggyBank className="text-secondary" size={24} />
        </div>
        <div>
          <span className="font-numeral-lg text-[32px] font-semibold text-on-background leading-none">
            R$ {fmt(data.savedAmount)}
          </span>
        </div>
      </div>

      {/* Faturas abertas */}
      <div className="glass-card rounded-xl p-lg flex flex-col gap-sm">
        <div className="flex justify-between items-start">
          <span className="text-on-surface-variant font-label-md text-[14px] uppercase tracking-wider">Faturas abertas</span>
          <CreditCard className="text-on-surface-variant" size={24} />
        </div>
        <div>
          <span className="font-numeral-lg text-[32px] font-semibold text-on-background leading-none">
            R$ {fmt(data.openInvoices)}
          </span>
        </div>
      </div>

      {/* Contas fixas */}
      <div className="glass-card rounded-xl p-lg flex flex-col gap-sm">
        <div className="flex justify-between items-start">
          <span className="text-on-surface-variant font-label-md text-[14px] uppercase tracking-wider">Contas fixas</span>
          <ReceiptText className="text-on-surface-variant" size={24} />
        </div>
        <div>
          <span className="font-numeral-lg text-[32px] font-semibold text-on-background leading-none">
            R$ {fmt(data.fixedBillsTotal)}
          </span>
        </div>
      </div>
    </section>
  );
}
