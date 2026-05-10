import { Wallet, ArrowDownToLine, ArrowUpRight, PiggyBank, CreditCard, ReceiptText, type LucideIcon } from 'lucide-react';
import type { SummaryCards } from '../../types/financial';

interface SummaryCardsGridProps {
  data: SummaryCards;
}

export function SummaryCardsGrid({ data }: SummaryCardsGridProps) {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const cardClass = 'rounded-xl p-sm min-[390px]:p-md sm:p-lg flex flex-col justify-between gap-xs sm:gap-sm min-h-[112px] sm:min-h-[136px] min-w-0 border-t-2 lg:col-span-1';
  const groupClass = 'font-label-md text-[9px] min-[390px]:text-[10px] uppercase tracking-wider leading-tight text-on-surface-variant/70';
  const labelClass = 'text-on-surface-variant font-label-md text-[10px] min-[390px]:text-[11px] sm:text-[12px] uppercase tracking-wider leading-tight';
  const valueClass = 'font-numeral-lg text-[18px] min-[360px]:text-[20px] min-[390px]:text-[22px] sm:text-[28px] lg:text-[30px] xl:text-[22px] 2xl:text-[26px] font-semibold leading-tight break-words';
  const toneClass = {
    balance: {
      card: 'border-t-primary bg-primary/5',
      icon: 'text-primary bg-primary/10',
      value: 'text-on-background font-bold',
    },
    income: {
      card: 'border-t-primary/70',
      icon: 'text-primary bg-primary/10',
      value: 'text-primary',
    },
    expense: {
      card: 'border-t-tertiary-container bg-tertiary-container/5',
      icon: 'text-tertiary-container bg-tertiary-container/10',
      value: 'text-tertiary-container',
    },
    invoices: {
      card: 'border-t-secondary bg-secondary/5',
      icon: 'text-secondary bg-secondary/10',
      value: 'text-on-background',
    },
    fixedBills: {
      card: 'border-t-outline bg-surface-variant/10',
      icon: 'text-on-surface-variant bg-surface-variant/60',
      value: 'text-on-background',
    },
    forecast: {
      card: 'border-t-secondary/80 bg-secondary/5',
      icon: 'text-secondary bg-secondary/10',
      value: 'text-secondary',
    },
  };

  const summaryCardOrder: Array<{
    key: string;
    group: string;
    label: string;
    value: number;
    icon: LucideIcon;
    tone: keyof typeof toneClass;
    surface: 'glass-card' | 'glass-card-premium';
  }> = [
    { key: 'balance', group: 'Disponível', label: 'Saldo atual', value: data.currentBalance, icon: Wallet, tone: 'balance', surface: 'glass-card-premium' },
    { key: 'income', group: 'Entrando', label: 'Entradas do mês', value: data.totalIncome, icon: ArrowDownToLine, tone: 'income', surface: 'glass-card' },
    { key: 'expense', group: 'Saindo', label: 'Gastos do mês', value: data.totalExpense, icon: ArrowUpRight, tone: 'expense', surface: 'glass-card' },
    { key: 'invoices', group: 'Compromissos', label: 'Faturas abertas', value: data.openInvoices, icon: CreditCard, tone: 'invoices', surface: 'glass-card' },
    { key: 'fixed-bills', group: 'Compromissos', label: 'Contas fixas', value: data.fixedBillsTotal, icon: ReceiptText, tone: 'fixedBills', surface: 'glass-card' },
    { key: 'forecast', group: 'Previsão', label: 'Sobra prevista', value: data.projectedBalance, icon: PiggyBank, tone: 'forecast', surface: 'glass-card' },
  ];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-sm sm:gap-md min-w-0">
      {summaryCardOrder.map((item) => {
        const Icon = item.icon;
        const tone = toneClass[item.tone];

        return (
          <div key={item.key} className={`${item.surface} ${cardClass} ${tone.card}`}>
            <div className="flex justify-between items-start gap-sm min-w-0">
              <div className="min-w-0">
                <span className={groupClass}>{item.group}</span>
                <span className={`${labelClass} block mt-0.5`}>{item.label}</span>
              </div>
              <span className={`${tone.icon} shrink-0 rounded-lg p-1.5`}>
                <Icon size={18} />
              </span>
            </div>
            <div className="flex items-baseline gap-sm min-w-0">
              <span className={`${valueClass} ${tone.value}`}>
                R$ {fmt(item.value)}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
