import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardHeaderProps {
  title?: string;
  monthLabel?: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onOpenNewTransaction: () => void;
}

export function DashboardHeader({ 
  title = "Olá, Raniel", 
  monthLabel = "Maio 2026",
  onPreviousMonth,
  onNextMonth,
  onOpenNewTransaction 
}: DashboardHeaderProps) {
  return (
    <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-md text-primary dark:text-primary sticky top-0 z-40 border-b border-outline-variant dark:border-outline-variant flex justify-between items-center w-full h-24 px-xl">
      <div className="flex flex-col">
        <h2 className="font-h1 text-[32px] font-semibold text-on-background leading-tight">{title}</h2>
        <p className="font-body-md text-[16px] text-on-surface-variant">Resumo financeiro de {monthLabel}</p>
      </div>

      <div className="flex items-center gap-md">
        <div className="flex items-center gap-xs rounded-full border border-outline-variant bg-surface-container-low px-xs py-xs">
          <button
            type="button"
            onClick={onPreviousMonth}
            className="p-xs rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all active:scale-95 duration-150"
            aria-label="Mês anterior"
            title="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-xs px-sm text-on-surface">
            <CalendarDays size={18} className="text-primary" />
            <span className="font-label-md text-[14px] font-semibold whitespace-nowrap">{monthLabel}</span>
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            className="p-xs rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-all active:scale-95 duration-150"
            aria-label="Próximo mês"
            title="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button className="px-md py-sm rounded border border-[#243041] text-on-surface-variant font-label-md text-[14px] font-semibold hover:bg-surface-container-high transition-all">
          Exportar PDF
        </button>
        <button 
          onClick={onOpenNewTransaction}
          className="px-md py-sm rounded bg-primary text-on-primary font-label-md text-[14px] font-semibold hover:bg-primary-fixed transition-all shadow-[0_0_15px_rgba(0,230,118,0.2)]"
        >
          Novo lançamento
        </button>
      </div>
    </header>
  );
}
