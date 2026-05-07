import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { 
  UpcomingBill, 
  CreditCardInvoice, 
  FinancialGoal, 
  SummaryCards,
  BalanceEvolutionData,
  CategoryExpenseData,
  MonthlyAnalysis
} from '../types/financial';
import { 
  summaryCardsMock, 
  balanceEvolutionMock, 
  categoryExpenseMock, 
  monthlyAnalysisMock 
} from '../data/financial-dashboard-mock';

export function useDashboardData() {
  const [upcomingBills, setUpcomingBills] = useState<UpcomingBill[]>([]);
  const [creditCardInvoices, setCreditCardInvoices] = useState<CreditCardInvoice[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  
  // Complex aggregations would normally happen via a Supabase RPC or backend edge function.
  // For now, we fallback to mock data for the charts while we focus on the basic tables.
  const [summaryCards] = useState<SummaryCards>(summaryCardsMock);
  const [balanceEvolution] = useState<BalanceEvolutionData[]>(balanceEvolutionMock);
  const [categoryExpense] = useState<CategoryExpenseData[]>(categoryExpenseMock);
  const [monthlyAnalysis] = useState<MonthlyAnalysis>(monthlyAnalysisMock);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      try {
        // Fetch Upcoming Bills
        const { data: billsData, error: billsError } = await supabase
          .from('upcoming_bills')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (billsError) throw billsError;
        if (billsData) {
          setUpcomingBills(billsData.map(b => ({
            id: b.id,
            description: b.description,
            value: Number(b.value),
            dueDate: b.due_date,
            status: b.status,
            icon: b.icon
          })));
        }

        // Fetch Credit Card Invoices
        const { data: cardsData, error: cardsError } = await supabase
          .from('credit_card_invoices')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (cardsError) throw cardsError;
        if (cardsData) {
          setCreditCardInvoices(cardsData.map(c => ({
            id: c.id,
            name: c.name,
            value: Number(c.value),
            dueDate: c.due_date,
            color: c.color,
            initial: c.initial
          })));
        }

        // Fetch Financial Goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('financial_goals')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (goalsError) throw goalsError;
        if (goalsData) {
          setFinancialGoals(goalsData.map(g => {
            const target = Number(g.target_amount);
            const current = Number(g.current_amount);
            return {
              id: g.id,
              title: g.title,
              targetAmount: target,
              currentAmount: current,
              progressPercentage: target > 0 ? Math.round((current / target) * 100) : 0
            };
          }));
        }

        // To do: Fetch transactions and compute summaryCards, balanceEvolution, categoryExpense...
      } catch (error) {
        console.error("Error fetching Supabase data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return {
    upcomingBills,
    creditCardInvoices,
    financialGoals,
    summaryCards,
    balanceEvolution,
    categoryExpense,
    monthlyAnalysis,
    isLoading
  };
}
