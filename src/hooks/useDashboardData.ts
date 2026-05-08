import { useCallback, useEffect, useState } from 'react';
import { subscribeFinancialDataChanged } from '../lib/financialEvents';
import { supabase } from '../lib/supabase';
import type {
  BalanceEvolutionData,
  CategoryExpenseData,
  CreditCard,
  FinancialGoal,
  FixedBill,
  MonthlyAnalysis,
  SummaryCards,
  Transaction,
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

const fallbackExpenseColors = ['#75ff9e', '#7bd0ff', '#ffba79', '#859585', '#ffb4ab'];

export function useDashboardData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [summaryCards, setSummaryCards] = useState<SummaryCards>(emptySummary);
  const [balanceEvolution, setBalanceEvolution] = useState<BalanceEvolutionData[]>([]);
  const [categoryExpense, setCategoryExpense] = useState<CategoryExpenseData[]>([]);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState<MonthlyAnalysis>(defaultAnalysis);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [txResult, billsResult, cardsResult, invoiceResult, goalsResult] = await Promise.all([
        supabase.from('transactions').select('*, category:categories(*)').order('date', { ascending: false }),
        supabase.from('fixed_bills').select('*, category:categories(*)').order('due_day', { ascending: true }),
        supabase.from('credit_cards').select('*').order('created_at', { ascending: true }),
        supabase.from('invoice_items').select('amount'),
        supabase.from('financial_goals').select('*').order('created_at', { ascending: true }),
      ]);

      if (txResult.error) throw txResult.error;
      if (billsResult.error) throw billsResult.error;
      if (cardsResult.error) throw cardsResult.error;
      if (invoiceResult.error) throw invoiceResult.error;
      if (goalsResult.error) throw goalsResult.error;

      const mappedTransactions = (txResult.data ?? []).map((transaction: Record<string, unknown>) => ({
        ...transaction,
        amount: Number(transaction.amount),
      })) as Transaction[];

      const mappedBills = (billsResult.data ?? []).map((bill: Record<string, unknown>) => ({
        ...bill,
        amount: Number(bill.amount),
      })) as FixedBill[];

      const mappedCards = (cardsResult.data ?? []).map((card: Record<string, unknown>) => ({
        ...card,
        credit_limit: Number(card.credit_limit),
      })) as CreditCard[];

      const mappedGoals = (goalsResult.data ?? []).map((goal: Record<string, unknown>) => ({
        ...goal,
        target_amount: Number(goal.target_amount),
        current_amount: Number(goal.current_amount),
      })) as FinancialGoal[];

      const totalIncome = mappedTransactions
        .filter(transaction => transaction.type === 'entrada')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const totalExpense = mappedTransactions
        .filter(transaction => transaction.type === 'gasto')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const fixedBillsTotal = mappedBills.reduce((sum, bill) => sum + bill.amount, 0);
      const openInvoices = (invoiceResult.data ?? [])
        .reduce((sum: number, item: Record<string, unknown>) => sum + Number(item.amount), 0);
      const savedAmount = mappedGoals.reduce((sum, goal) => sum + goal.current_amount, 0);

      setTransactions(mappedTransactions);
      setFixedBills(mappedBills);
      setCreditCards(mappedCards);
      setFinancialGoals(mappedGoals);
      setSummaryCards({
        freeBalance: totalIncome - totalExpense,
        totalIncome,
        totalExpense,
        savedAmount,
        openInvoices,
        fixedBillsTotal,
      });
      setBalanceEvolution(buildBalanceEvolution(mappedTransactions));
      setCategoryExpense(buildCategoryExpense(mappedTransactions));
      setMonthlyAnalysis(buildMonthlyAnalysis(totalIncome, totalExpense, mappedTransactions.length));
    } catch (error) {
      console.error('Error fetching Supabase data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchData]);

  useEffect(() => subscribeFinancialDataChanged(() => {
    void fetchData();
  }), [fetchData]);

  return {
    transactions,
    fixedBills,
    creditCards,
    financialGoals,
    summaryCards,
    balanceEvolution,
    categoryExpense,
    monthlyAnalysis,
    isLoading,
  };
}

function buildBalanceEvolution(transactions: Transaction[]) {
  const byMonth = new Map<string, number>();

  transactions.forEach(transaction => {
    const date = new Date(`${transaction.date}T00:00:00`);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const signedAmount = transaction.type === 'entrada' ? transaction.amount : -transaction.amount;
    byMonth.set(key, (byMonth.get(key) ?? 0) + signedAmount);
  });

  return [...byMonth.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([key, balance]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month: new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }),
        balance,
      };
    });
}

function buildCategoryExpense(transactions: Transaction[]) {
  const byCategory = new Map<string, { value: number; color: string }>();

  transactions
    .filter(transaction => transaction.type === 'gasto')
    .forEach(transaction => {
      const name = transaction.category?.name ?? 'Sem categoria';
      const color = transaction.category?.color ?? fallbackExpenseColors[byCategory.size % fallbackExpenseColors.length];
      const current = byCategory.get(name);
      byCategory.set(name, {
        value: (current?.value ?? 0) + transaction.amount,
        color: current?.color ?? color,
      });
    });

  return [...byCategory.entries()]
    .sort(([, left], [, right]) => right.value - left.value)
    .slice(0, 5)
    .map(([name, data]) => ({ name, value: data.value, color: data.color }));
}

function buildMonthlyAnalysis(totalIncome: number, totalExpense: number, transactionCount: number): MonthlyAnalysis {
  if (transactionCount === 0) return defaultAnalysis;

  const ratio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;
  return {
    title: 'Análise do mês',
    description: `Você gastou ${ratio}% da sua renda este mês. ${ratio > 70 ? 'Cuidado com gastos excessivos!' : 'Continue assim!'}`,
    actionText: 'Ver detalhes',
  };
}
