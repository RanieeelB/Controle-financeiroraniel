import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { DashboardHeader } from './DashboardHeader';
import { NewTransactionModal } from '../dashboard/NewTransactionModal';

export function Layout() {
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const location = useLocation();

  // Basic title mapping based on route path
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

  const getPageSubtitle = () => {
    // We could make this dynamic, but for now a static month/year is fine as per mock
    return 'Maio 2026';
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex selection:bg-primary-container selection:text-on-primary-container relative">
      <AppSidebar />
      
      <main className="flex-1 ml-64 min-h-screen bg-background relative flex flex-col">
        {/* Abstract Background Glow */}
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>
        
        <DashboardHeader 
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          onOpenNewTransaction={() => setIsNewTransactionModalOpen(true)} 
        />

        <div className="flex-1 p-xl max-w-[1440px] w-full mx-auto space-y-xl relative z-10">
          <Outlet />
        </div>
      </main>

      <NewTransactionModal 
        isOpen={isNewTransactionModalOpen} 
        onClose={() => setIsNewTransactionModalOpen(false)} 
      />
    </div>
  );
}
