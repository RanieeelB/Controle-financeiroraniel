import { CalendarDays } from 'lucide-react';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  onOpenNewTransaction: () => void;
}

export function DashboardHeader({ 
  title = "Olá, Raniel", 
  subtitle = "Aqui está o resumo financeiro de Maio de 2026", 
  onOpenNewTransaction 
}: DashboardHeaderProps) {
  return (
    <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-md text-primary dark:text-primary sticky top-0 z-40 border-b border-outline-variant dark:border-outline-variant flex justify-between items-center w-full h-24 px-xl">
      <div className="flex flex-col">
        <h2 className="font-h1 text-[32px] font-semibold text-on-background leading-tight">{title}</h2>
        <p className="font-body-md text-[16px] text-on-surface-variant">{subtitle}</p>
      </div>

      <div className="flex items-center gap-md">
        <button className="p-sm rounded-full text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95 duration-150">
          <CalendarDays size={24} />
        </button>
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
