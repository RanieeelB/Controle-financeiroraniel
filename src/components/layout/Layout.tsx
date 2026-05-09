import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { DashboardHeader } from './DashboardHeader';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <div className="bg-background text-on-background font-body-md min-h-[100dvh] flex selection:bg-primary-container selection:text-on-primary-container relative overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:transform-none lg:relative transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <AppSidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
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
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        <div className="flex-1 p-xl max-w-[1440px] w-full mx-auto space-y-xl relative z-10">
          <Outlet context={{ selectedMonthRange } satisfies LayoutContext} />
        </div>
      </main>

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
