import { ChevronLeft, ChevronRight, LogOut, Building2, Menu, FileDown, Plus } from 'lucide-react';
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
    <header className="bg-surface/90 dark:bg-surface/90 backdrop-blur-xl text-primary dark:text-primary sticky top-0 z-40 border-b border-outline-variant/80 dark:border-outline-variant/80 w-full px-4 py-3 md:px-xl md:py-md shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 min-w-0">
        <div className="flex items-start sm:items-center justify-between gap-md min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                className="lg:hidden -ml-2 text-on-surface hover:bg-surface-variant rounded-full transition-colors min-h-11 min-w-11 flex items-center justify-center"
                aria-label="Abrir menu"
              >
                <Menu size={24} />
              </button>
            )}
            <div className="min-w-0">
              <p className="hidden sm:block text-[11px] uppercase tracking-wider text-on-surface-variant font-label-md">Saldo Real</p>
              <h2 className="font-h1 text-[22px] sm:text-[24px] md:text-[30px] font-semibold text-on-background leading-tight truncate">{title}</h2>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-xs rounded-full border border-outline-variant bg-surface-container-low/80 px-1.5 py-1 w-full sm:w-fit">
          <button onClick={onPreviousMonth} className="text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-primary/10 min-h-9 min-w-9 flex items-center justify-center" aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </button>
          <span className="font-label-md text-[13px] sm:text-[14px] text-on-surface min-w-0 flex-1 sm:min-w-[140px] text-center px-sm truncate">{monthLabel}</span>
          <button onClick={onNextMonth} className="text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-primary/10 min-h-9 min-w-9 flex items-center justify-center" aria-label="Próximo mês">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-sm w-full sm:w-auto overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          <button
            onClick={onOpenPjTaxes}
            className="flex shrink-0 px-md py-sm rounded-full border border-tertiary-container/70 bg-tertiary-container/10 text-tertiary-container font-label-md text-[14px] font-semibold hover:bg-tertiary-container/15 transition-all items-center gap-2 min-h-11"
          >
            <Building2 size={16} />
            <span className="hidden min-[390px]:inline">Impostos PJ</span>
            <span className="min-[390px]:hidden">PJ</span>
          </button>
          <button className="shrink-0 px-md py-sm rounded-full border border-outline-variant text-on-surface-variant font-label-md text-[14px] font-semibold hover:bg-surface-container-high hover:text-on-surface transition-all min-h-11 flex items-center gap-2" aria-label="Exportar PDF">
            <FileDown size={16} />
            <span className="hidden min-[390px]:inline">Exportar PDF</span>
            <span className="min-[390px]:hidden">PDF</span>
          </button>
          <button
            onClick={onOpenNewTransaction}
            className="shrink-0 px-md py-sm rounded-full bg-primary text-on-primary font-label-md text-[14px] font-semibold hover:bg-primary-fixed transition-all shadow-[0_0_15px_rgba(0,230,118,0.2)] min-h-11 flex items-center gap-2"
          >
            <Plus size={16} />
            <span className="hidden min-[390px]:inline">Novo lançamento</span>
            <span className="min-[390px]:hidden">Novo</span>
          </button>
          <button
            onClick={() => signOut()}
            className="rounded-full border border-transparent text-on-surface-variant hover:bg-error-container/20 hover:text-error hover:border-error/20 transition-all flex shrink-0 min-h-11 min-w-11 items-center justify-center"
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
