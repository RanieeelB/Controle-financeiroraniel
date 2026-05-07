import { useState } from 'react';
import { AppSidebar } from './components/layout/AppSidebar';
import { DashboardHeader } from './components/layout/DashboardHeader';
import { SummaryCardsGrid } from './components/dashboard/SummaryCardsGrid';
import { BalanceEvolutionChart } from './components/dashboard/BalanceEvolutionChart';
import { CategoryExpenseChart } from './components/dashboard/CategoryExpenseChart';
import { MonthlyAnalysisCard } from './components/dashboard/MonthlyAnalysisCard';
import { UpcomingBills } from './components/dashboard/UpcomingBills';
import { CreditCardInvoices } from './components/dashboard/CreditCardInvoices';
import { FinancialGoalCard } from './components/dashboard/FinancialGoalCard';
import { NewTransactionModal } from './components/dashboard/NewTransactionModal';
import { useDashboardData } from './hooks/useDashboardData';

function App() {
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  
  const { 
    upcomingBills, 
    creditCardInvoices, 
    financialGoals, 
    summaryCards, 
    balanceEvolution, 
    categoryExpense, 
    monthlyAnalysis, 
    isLoading 
  } = useDashboardData();

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex selection:bg-primary-container selection:text-on-primary-container relative">
      <AppSidebar />
      
      <main className="flex-1 ml-64 min-h-screen bg-background relative flex flex-col">
        {/* Abstract Background Glow */}
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>
        
        <DashboardHeader onOpenNewTransaction={() => setIsNewTransactionModalOpen(true)} />

        <div className="flex-1 p-xl max-w-[1440px] w-full mx-auto space-y-xl relative z-10">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <SummaryCardsGrid data={summaryCards} />
              
              {/* Charts & Complex Data */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-md">
                <BalanceEvolutionChart data={balanceEvolution} />
                
                <div className="flex flex-col gap-md">
                  <CategoryExpenseChart data={categoryExpense} />
                  <MonthlyAnalysisCard 
                    data={monthlyAnalysis} 
                    committedPercentage={summaryCards.committedIncome} 
                  />
                </div>
              </section>

              {/* Bottom Data Rows */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
                <UpcomingBills data={upcomingBills} />
                
                {/* Right Column: Faturas & Metas */}
                <div className="flex flex-col gap-md">
                  <CreditCardInvoices data={creditCardInvoices} />
                  <FinancialGoalCard data={financialGoals} />
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <NewTransactionModal 
        isOpen={isNewTransactionModalOpen} 
        onClose={() => setIsNewTransactionModalOpen(false)} 
      />
    </div>
  );
}

export default App;
