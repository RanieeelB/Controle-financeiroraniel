import { SummaryCardsGrid } from '../components/dashboard/SummaryCardsGrid';
import { BalanceEvolutionChart } from '../components/dashboard/BalanceEvolutionChart';
import { CategoryExpenseChart } from '../components/dashboard/CategoryExpenseChart';
import { MonthlyAnalysisCard } from '../components/dashboard/MonthlyAnalysisCard';
import { UpcomingBills } from '../components/dashboard/UpcomingBills';
import { CreditCardInvoices } from '../components/dashboard/CreditCardInvoices';
import { FinancialGoalCard } from '../components/dashboard/FinancialGoalCard';
import { ProjectionsSection } from '../components/dashboard/ProjectionsSection';
import { useDashboardData } from '../hooks/useDashboardData';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../components/layout/Layout';

export function Dashboard() {
  const { selectedMonthRange } = useOutletContext<LayoutContext>();
  const { 
    fixedBills, 
    creditCards, 
    financialGoals, 
    summaryCards, 
    balanceEvolution, 
    categoryExpense, 
    monthlyAnalysis, 
    isLoading 
  } = useDashboardData(selectedMonthRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-lg lg:space-y-xl min-w-0">
      <SummaryCardsGrid data={summaryCards} />
      
      {/* Charts & Complex Data */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-lg lg:gap-xl min-w-0">
        <BalanceEvolutionChart data={balanceEvolution} />
        
        <div className="flex flex-col gap-lg min-w-0">
          <CategoryExpenseChart data={categoryExpense} />
          <MonthlyAnalysisCard 
            data={monthlyAnalysis} 
            committedPercentage={summaryCards.totalIncome > 0 ? Math.round((summaryCards.totalExpense / summaryCards.totalIncome) * 100) : 0} 
          />
        </div>
      </section>

      {/* Bottom Data Rows */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-lg lg:gap-xl min-w-0">
        <UpcomingBills data={fixedBills} />
        
        {/* Right Column: Cards & Goals */}
        <div className="flex flex-col gap-lg min-w-0">
          <CreditCardInvoices data={creditCards} />
          <FinancialGoalCard data={financialGoals} />
        </div>
      </section>

      <ProjectionsSection />
    </div>
  );
}
