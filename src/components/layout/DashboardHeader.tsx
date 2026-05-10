import { ChevronLeft, ChevronRight, LogOut, Building2, FileDown, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface DashboardHeaderProps {
  title?: string;
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onOpenNewTransaction: () => void;
  onOpenPjTaxes: () => void;
}

export function DashboardHeader({ 
  title = "Dashboard", 
  monthLabel,
  onPreviousMonth,
  onNextMonth,
  onOpenNewTransaction,
  onOpenPjTaxes,
}: DashboardHeaderProps) {
  const { signOut } = useAuth();

  return (
    <header className="relative bg-surface/92 dark:bg-surface/92 backdrop-blur-xl text-primary dark:text-primary sticky top-0 z-40 border-b border-outline-variant/70 dark:border-outline-variant/70 w-full px-4 py-2.5 md:px-xl md:py-md shadow-[0_12px_36px_rgba(0,0,0,0.2)] after:absolute after:left-0 after:right-0 after:-bottom-5 after:h-5 after:bg-background/25 after:backdrop-blur-lg after:pointer-events-none after:content-['']">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-3 min-w-0">
        <div className="hidden lg:flex order-1 items-start sm:items-center justify-between gap-md min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="hidden sm:block text-[11px] uppercase tracking-wider text-on-surface-variant font-label-md">Saldo Real</p>
              <h2 className="font-h1 text-[22px] sm:text-[24px] md:text-[30px] font-semibold text-on-background leading-tight truncate">{title}</h2>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="order-3 lg:order-2 flex items-center justify-between sm:justify-start gap-xs rounded-2xl lg:rounded-full border border-outline-variant bg-surface-container-low/80 px-1.5 py-1 w-full lg:w-fit shadow-inner shadow-black/10">
          <button onClick={onPreviousMonth} className="text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-primary/10 min-h-9 min-w-9 flex items-center justify-center" aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </button>
          <span className="font-label-md text-[13px] sm:text-[14px] text-on-surface min-w-0 flex-1 sm:min-w-[140px] text-center px-sm truncate">{monthLabel}</span>
          <button onClick={onNextMonth} className="text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-primary/10 min-h-9 min-w-9 flex items-center justify-center" aria-label="Próximo mês">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="order-2 lg:order-3 grid grid-cols-3 lg:flex items-center gap-xs sm:gap-sm w-full sm:w-auto lg:w-auto">
          <button
            onClick={onOpenPjTaxes}
            className="flex justify-center shrink-0 px-sm sm:px-md py-xs sm:py-sm rounded-2xl lg:rounded-full border border-tertiary-container/70 bg-tertiary-container/10 text-tertiary-container font-label-md text-[12px] min-[390px]:text-[13px] sm:text-[14px] font-semibold hover:bg-tertiary-container/15 transition-all items-center gap-2 min-h-10 sm:min-h-11"
          >
            <Building2 size={16} />
            <span className="hidden sm:inline">Impostos PJ</span>
            <span className="sm:hidden">PJ</span>
          </button>
          <button className="justify-center shrink-0 px-sm sm:px-md py-xs sm:py-sm rounded-2xl lg:rounded-full border border-outline-variant bg-surface-container-low/60 text-on-surface-variant font-label-md text-[12px] min-[390px]:text-[13px] sm:text-[14px] font-semibold hover:bg-surface-container-high hover:text-on-surface transition-all min-h-10 sm:min-h-11 flex items-center gap-2" aria-label="Exportar PDF">
            <FileDown size={16} />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button
            onClick={onOpenNewTransaction}
            className="justify-center shrink-0 px-sm sm:px-md py-xs sm:py-sm rounded-2xl lg:rounded-full bg-primary text-on-primary font-label-md text-[12px] min-[390px]:text-[13px] sm:text-[14px] font-semibold hover:bg-primary-fixed transition-all shadow-[0_0_18px_rgba(0,230,118,0.22)] min-h-10 sm:min-h-11 flex items-center gap-2"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Novo lançamento</span>
            <span className="sm:hidden">Novo</span>
          </button>
          <button
            onClick={() => signOut()}
            className="hidden lg:flex rounded-full border border-transparent text-on-surface-variant hover:bg-error-container/20 hover:text-error hover:border-error/20 transition-all shrink-0 min-h-11 min-w-11 items-center justify-center"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
