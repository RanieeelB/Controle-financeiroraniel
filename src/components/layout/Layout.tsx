import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { DashboardHeader } from './DashboardHeader';
import { MobileFloatingNav } from './MobileFloatingNav';
import { NewTransactionModal } from '../dashboard/NewTransactionModal';
import { PjTaxesModal } from '../dashboard/PjTaxesModal';
import { useAutoInvestments } from '../../hooks/useAutoInvestments';
import { useAutoSalary } from '../../hooks/useAutoSalary';
import { getCurrentMonthKey, buildMonthRange, moveMonth, formatMonthLabel } from '../../lib/monthSelection';
import type { MonthRange } from '../../lib/monthSelection';

// Context type shared with child pages via Outlet context
export interface LayoutContext {
  selectedMonthRange: MonthRange;
}

export function Layout() {
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [isPjTaxesModalOpen, setIsPjTaxesModalOpen] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState(getCurrentMonthKey());
  const location = useLocation();

  const selectedMonthRange = buildMonthRange(selectedMonthKey);
  const monthLabel = formatMonthLabel(selectedMonthKey);
  useAutoInvestments();
  useAutoSalary(selectedMonthKey);

  const handlePreviousMonth = () => setSelectedMonthKey(prev => moveMonth(prev, -1));
  const handleNextMonth = () => setSelectedMonthKey(prev => moveMonth(prev, 1));

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/entradas': return 'Entradas';
      case '/gastos': return 'Gastos';
      case '/cartoes': return 'Cartões';
      case '/faturas': return 'Faturas';
      case '/contas-fixas': return 'Contas Fixas';
      case '/investimentos': return 'Investimentos';
      case '/metas': return 'Metas';
      case '/relatorios': return 'Relatórios';
      case '/configuracoes': return 'Configurações';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-[100dvh] flex selection:bg-primary-container selection:text-on-primary-container relative overflow-x-clip">
      <div className="hidden lg:block lg:sticky lg:top-0 lg:z-30 lg:self-start">
        <AppSidebar />
      </div>
      
      <main className="flex-1 w-full min-w-0 min-h-[100dvh] bg-background relative flex flex-col">
        {/* Abstract Background Glow */}
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>
        
        <DashboardHeader 
          title={getPageTitle()}
          monthLabel={monthLabel}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onOpenNewTransaction={() => setIsNewTransactionModalOpen(true)}
          onOpenPjTaxes={() => setIsPjTaxesModalOpen(true)}
        />

        <div className="flex-1 px-4 pt-lg pb-32 sm:px-6 sm:pt-xl sm:pb-36 lg:px-xl lg:py-xl max-w-[1440px] w-full mx-auto space-y-lg lg:space-y-xl relative z-10 min-w-0">
          <Outlet context={{ selectedMonthRange } satisfies LayoutContext} />
        </div>
      </main>

      <MobileFloatingNav />

      <NewTransactionModal 
        isOpen={isNewTransactionModalOpen} 
        onClose={() => setIsNewTransactionModalOpen(false)} 
      />

      {isPjTaxesModalOpen && (
        <PjTaxesModal 
          monthRange={selectedMonthRange} 
          onClose={() => setIsPjTaxesModalOpen(false)} 
        />
      )}
    </div>
  );
}
