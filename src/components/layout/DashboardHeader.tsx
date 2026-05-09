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
    <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-md text-primary dark:text-primary sticky top-0 z-40 border-b border-outline-variant dark:border-outline-variant flex justify-between items-center w-full h-24 px-4 md:px-xl">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button 
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 -ml-2 text-on-surface hover:bg-surface-variant rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
          )}
          <h2 className="font-h1 text-[24px] md:text-[32px] font-semibold text-on-background leading-tight">{title}</h2>
        </div>
        {/* Month Navigation */}
        <div className="flex items-center gap-sm mt-xs">
          <button onClick={onPreviousMonth} className="p-0.5 text-on-surface-variant hover:text-primary transition-colors rounded hover:bg-primary/10">
            <ChevronLeft size={18} />
          </button>
          <span className="font-body-md text-[14px] text-on-surface-variant min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={onNextMonth} className="p-0.5 text-on-surface-variant hover:text-primary transition-colors rounded hover:bg-primary/10">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-md">
        <button 
          onClick={onOpenPjTaxes}
          className="hidden md:flex px-md py-sm rounded border border-tertiary-container text-tertiary-container font-label-md text-[14px] font-semibold hover:bg-tertiary-container/10 transition-all items-center gap-2"
        >
          <Building2 size={16} /> Impostos PJ
        </button>
        <button className="hidden md:block px-md py-sm rounded border border-[#243041] text-on-surface-variant font-label-md text-[14px] font-semibold hover:bg-surface-container-high transition-all">
          Exportar PDF
        </button>
        <button 
          onClick={onOpenNewTransaction}
          className="px-md py-sm rounded bg-primary text-on-primary font-label-md text-[14px] font-semibold hover:bg-primary-fixed transition-all shadow-[0_0_15px_rgba(0,230,118,0.2)]"
        >
          Novo lançamento
        </button>
        <button 
          onClick={() => signOut()}
          className="p-sm rounded-full text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-all hidden md:flex"
          title="Sair"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
