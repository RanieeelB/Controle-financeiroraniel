import { ChevronLeft, ChevronRight, LogOut, Building2, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface DashboardHeaderProps {
  title?: string;
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onOpenNewTransaction: () => void;
  onOpenPjTaxes: () => void;
  onToggleMobileMenu?: () => void;
}

export function DashboardHeader({ 
  title = "Dashboard", 
  monthLabel,
  onPreviousMonth,
  onNextMonth,
  onOpenNewTransaction,
  onOpenPjTaxes,
  onToggleMobileMenu
}: DashboardHeaderProps) {
  const { signOut } = useAuth();

  return (
    <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-md text-primary dark:text-primary sticky top-0 z-40 border-b border-outline-variant dark:border-outline-variant flex flex-col sm:flex-row sm:justify-between sm:items-center gap-sm w-full px-4 py-sm md:px-xl md:py-md">
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button 
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 -ml-2 text-on-surface hover:bg-surface-variant rounded-lg transition-colors min-h-11 min-w-11 flex items-center justify-center"
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </button>
          )}
          <h2 className="font-h1 text-[22px] sm:text-[24px] md:text-[32px] font-semibold text-on-background leading-tight truncate">{title}</h2>
        </div>
        {/* Month Navigation */}
        <div className="flex items-center gap-sm mt-xs">
          <button onClick={onPreviousMonth} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded hover:bg-primary/10 min-h-9 min-w-9 flex items-center justify-center" aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </button>
          <span className="font-body-md text-[13px] sm:text-[14px] text-on-surface-variant min-w-[120px] sm:min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={onNextMonth} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded hover:bg-primary/10 min-h-9 min-w-9 flex items-center justify-center" aria-label="Próximo mês">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-sm md:gap-md w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
        <button 
          onClick={onOpenPjTaxes}
          className="flex shrink-0 px-md py-sm rounded border border-tertiary-container text-tertiary-container font-label-md text-[14px] font-semibold hover:bg-tertiary-container/10 transition-all items-center gap-2 min-h-11"
        >
          <Building2 size={16} /> <span className="hidden min-[390px]:inline">Impostos PJ</span><span className="min-[390px]:hidden">PJ</span>
        </button>
        <button className="shrink-0 px-md py-sm rounded border border-[#243041] text-on-surface-variant font-label-md text-[14px] font-semibold hover:bg-surface-container-high transition-all min-h-11">
          Exportar PDF
        </button>
        <button 
          onClick={onOpenNewTransaction}
          className="shrink-0 px-md py-sm rounded bg-primary text-on-primary font-label-md text-[14px] font-semibold hover:bg-primary-fixed transition-all shadow-[0_0_15px_rgba(0,230,118,0.2)] min-h-11"
        >
          <span className="hidden min-[390px]:inline">Novo lançamento</span><span className="min-[390px]:hidden">Novo</span>
        </button>
        <button 
          onClick={() => signOut()}
          className="p-sm rounded-full text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-all flex shrink-0 min-h-11 min-w-11 items-center justify-center"
          title="Sair"
          aria-label="Sair"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
