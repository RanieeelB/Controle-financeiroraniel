import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { 
  FixedBill, 
  CreditCard, 
  FinancialGoal, 
  SummaryCards,
  BalanceEvolutionData,
  CategoryExpenseData,
  MonthlyAnalysis,
  Transaction
} from '../types/financial';

const emptySummary: SummaryCards = {
  freeBalance: 0,
  totalIncome: 0,
  totalExpense: 0,
  savedAmount: 0,
  openInvoices: 0,
  fixedBillsTotal: 0,
};

const defaultAnalysis: MonthlyAnalysis = {
  title: 'Sem dados',
  description: 'Adicione suas primeiras transações para ver a análise mensal.',
  actionText: 'Começar agora',
};

export function useDashboardData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [summaryCards, setSummaryCards] = useState<SummaryCards>(emptySummary);
  const [balanceEvolution] = useState<BalanceEvolutionData[]>([]);
  const [categoryExpense] = useState<CategoryExpenseData[]>([]);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState<MonthlyAnalysis>(defaultAnalysis);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      try {
        // Fetch Transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*, category:categories(*)')
          .order('date', { ascending: false });
        
        if (txData) {
          const mapped = txData.map((t: Record<string, unknown>) => ({
            ...t,
            amount: Number(t.amount),
          })) as Transaction[];
          setTransactions(mapped);

          // Compute summary
          const income = mapped.filter(t => t.type === 'entrada').reduce((s, t) => s + t.amount, 0);
          const expense = mapped.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0);
          
          setSummaryCards(prev => ({
            ...prev,
            totalIncome: income,
            totalExpense: expense,
            freeBalance: income - expense,
          }));
        }

        // Fetch Fixed Bills
        const { data: billsData } = await supabase
          .from('fixed_bills')
          .select('*, category:categories(*)')
          .order('due_day', { ascending: true });
          
        if (billsData) {
          const mapped = billsData.map((b: Record<string, unknown>) => ({
            ...b,
            amount: Number(b.amount),
          })) as FixedBill[];
          setFixedBills(mapped);

          const billsTotal = mapped.reduce((s, b) => s + b.amount, 0);
          setSummaryCards(prev => ({ ...prev, fixedBillsTotal: billsTotal }));
        }

        // Fetch Credit Cards
        const { data: cardsData } = await supabase
          .from('credit_cards')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (cardsData) {
          const mapped = cardsData.map((c: Record<string, unknown>) => ({
            ...c,
            credit_limit: Number(c.credit_limit),
          })) as CreditCard[];
          setCreditCards(mapped);
        }

        // Fetch Invoice Items total for open invoices
        const { data: invoiceData } = await supabase
          .from('invoice_items')
          .select('amount');
        
        if (invoiceData) {
          const total = invoiceData.reduce((s: number, i: Record<string, unknown>) => s + Number(i.amount), 0);
          setSummaryCards(prev => ({ ...prev, openInvoices: total }));
        }

        // Fetch Financial Goals
        const { data: goalsData } = await supabase
          .from('financial_goals')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (goalsData) {
          const mapped = goalsData.map((g: Record<string, unknown>) => ({
            ...g,
            target_amount: Number(g.target_amount),
            current_amount: Number(g.current_amount),
          })) as FinancialGoal[];
          setFinancialGoals(mapped);

          const savedTotal = mapped.reduce((s, g) => s + g.current_amount, 0);
          setSummaryCards(prev => ({ ...prev, savedAmount: savedTotal }));
        }

        // Build monthly analysis
        if (txData && txData.length > 0) {
          const income = txData.filter((t: Record<string, unknown>) => t.type === 'entrada').reduce((s: number, t: Record<string, unknown>) => s + Number(t.amount), 0);
          const expense = txData.filter((t: Record<string, unknown>) => t.type === 'gasto').reduce((s: number, t: Record<string, unknown>) => s + Number(t.amount), 0);
          const ratio = income > 0 ? Math.round((expense / income) * 100) : 0;
          
          setMonthlyAnalysis({
            title: 'Análise do mês',
            description: `Você gastou ${ratio}% da sua renda este mês. ${ratio > 70 ? 'Cuidado com gastos excessivos!' : 'Continue assim!'}`,
            actionText: 'Ver detalhes',
          });
        }
      } catch (error) {
        console.error("Error fetching Supabase data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return {
    transactions,
    fixedBills,
    creditCards,
    financialGoals,
    summaryCards,
    balanceEvolution,
    categoryExpense,
    monthlyAnalysis,
    isLoading
  };
}
