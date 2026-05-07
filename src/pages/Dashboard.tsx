import { SummaryCardsGrid } from '../components/dashboard/SummaryCardsGrid';
import { BalanceEvolutionChart } from '../components/dashboard/BalanceEvolutionChart';
import { CategoryExpenseChart } from '../components/dashboard/CategoryExpenseChart';
import { MonthlyAnalysisCard } from '../components/dashboard/MonthlyAnalysisCard';
import { UpcomingBills } from '../components/dashboard/UpcomingBills';
import { CreditCardInvoices } from '../components/dashboard/CreditCardInvoices';
import { FinancialGoalCard } from '../components/dashboard/FinancialGoalCard';
import { useDashboardData } from '../hooks/useDashboardData';

export function Dashboard() {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
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
  );
}
