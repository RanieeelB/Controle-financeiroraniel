import { useCallback, useEffect, useState } from 'react';
import { getFinancialDataVersion, subscribeFinancialDataChanged } from '../lib/financialEvents';
import { createFinancialRefreshCoordinator } from '../lib/financialRefreshCoordinator';
import { resolveDynamicFixedBills } from '../lib/fixedBillPayments';
import { buildDashboardFixedBillSummary } from '../lib/dashboardFixedBillSummary';
import { buildBalanceEvolution } from '../lib/balanceEvolution';
import { calculateSummaryCards } from '../lib/financialPlanning';
import { filterLegacyCarryoverTransactions } from '../lib/legacyCarryover';
import { supabase } from '../lib/supabase';
import { collectSupabasePages } from '../lib/supabasePagination';
import { calculateOpenInvoiceTotal } from '../lib/invoicePayments';
import type {
  BalanceEvolutionData,
  CategoryExpenseData,
  CreditCard,
  FinancialGoal,
  DynamicFixedBill,
  MonthlyAnalysis,
  SummaryCards,
  Transaction,
} from '../types/financial';

const emptySummary: SummaryCards = {
  currentBalance: 0,
  projectedBalance: 0,
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

import type { MonthRange } from '../lib/monthSelection';

const fallbackExpenseColors = ['#75ff9e', '#7bd0ff', '#ffba79', '#859585', '#ffb4ab'];

export function useDashboardData(monthRange?: MonthRange) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedBills, setFixedBills] = useState<DynamicFixedBill[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [summaryCards, setSummaryCards] = useState<SummaryCards>(emptySummary);
  const [balanceEvolution, setBalanceEvolution] = useState<BalanceEvolutionData[]>([]);
  const [categoryExpense, setCategoryExpense] = useState<CategoryExpenseData[]>([]);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState<MonthlyAnalysis>(defaultAnalysis);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCoordinator] = useState(() => createFinancialRefreshCoordinator<() => void>());

  const startDate = monthRange?.startDate;
  const endDate = monthRange?.endDate;
  const monthKey = monthRange?.monthKey;
  const queryKey = `${startDate ?? '*'}:${endDate ?? '*'}:${monthKey ?? '*'}`;

  const fetchData = useCallback((version = getFinancialDataVersion()) => refreshCoordinator.refresh({
    key: queryKey,
    version,
    onLoadingChange: setIsLoading,
    load: async () => {
      const transactionsPromise = collectSupabasePages<Record<string, unknown>>((from, to) => {
        let query = supabase
          .from('transactions')
          .select('*, category:categories(*)')
          .order('date', { ascending: false })
          .order('id', { ascending: true });
        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lt('date', endDate);
        return query.range(from, to);
      });
      const fixedBillsPromise = collectSupabasePages<Record<string, unknown>>((from, to) => supabase
        .from('fixed_bills')
        .select('*, category:categories(*)')
        .order('due_day', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to));
      const creditCardsPromise = collectSupabasePages<Record<string, unknown>>((from, to) => supabase
        .from('credit_cards')
        .select('*')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to));
      const invoiceItemsPromise = collectSupabasePages<Record<string, unknown>>((from, to) => {
        let query = supabase
          .from('invoice_items')
          .select('id, amount, description, date')
          .order('date', { ascending: true })
          .order('id', { ascending: true });
        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lt('date', endDate);
        return query.range(from, to);
      });
      const financialGoalsPromise = collectSupabasePages<Record<string, unknown>>((from, to) => supabase
        .from('financial_goals')
        .select('*')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to));

      const [txData, billsData, cardsData, invoiceData, goalsData] = await Promise.all([
        transactionsPromise,
        fixedBillsPromise,
        creditCardsPromise,
        invoiceItemsPromise,
        financialGoalsPromise,
      ]);

      const mappedTransactions = filterLegacyCarryoverTransactions(txData.map((transaction: Record<string, unknown>) => ({
        ...transaction,
        amount: Number(transaction.amount),
      })) as Transaction[]);

      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      const mappedBills = resolveDynamicFixedBills({
        bills: billsData as unknown as DynamicFixedBill[],
        payments: mappedTransactions,
        monthKey: monthKey ?? `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
        today,
      }) as DynamicFixedBill[];

      const mappedCards = cardsData.map((card: Record<string, unknown>) => ({
        ...card,
        credit_limit: Number(card.credit_limit),
      })) as CreditCard[];

      const mappedGoals = goalsData.map((goal: Record<string, unknown>) => ({
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
      const { fixedBillsTotal, unpaidFixedBills } = buildDashboardFixedBillSummary(mappedBills);
      const openInvoices = calculateOpenInvoiceTotal(
        invoiceData as unknown as Array<{ id: string; amount: number; description: string; date: string }>,
        mappedTransactions,
      );
      const savedAmount = mappedGoals.reduce((sum, goal) => sum + goal.current_amount, 0);

      const nextSummaryCards = calculateSummaryCards({
        transactions: mappedTransactions,
        savedAmount,
        openInvoices,
        fixedBillsTotal,
        unpaidFixedBills,
      });
      const nextBalanceEvolution = buildBalanceEvolution(mappedTransactions, today);
      const nextCategoryExpense = buildCategoryExpense(mappedTransactions);
      const nextMonthlyAnalysis = buildMonthlyAnalysis(totalIncome, totalExpense, mappedTransactions.length);

      return () => {
        setTransactions(mappedTransactions);
        setFixedBills(mappedBills);
        setCreditCards(mappedCards);
        setFinancialGoals(mappedGoals);
        setSummaryCards(nextSummaryCards);
        setBalanceEvolution(nextBalanceEvolution);
        setCategoryExpense(nextCategoryExpense);
        setMonthlyAnalysis(nextMonthlyAnalysis);
      };
    },
    apply: applyData => applyData(),
    onError: error => console.error('Error fetching Supabase data:', error),
  }), [endDate, monthKey, queryKey, refreshCoordinator, startDate]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchData]);

  useEffect(() => subscribeFinancialDataChanged(version => {
    void fetchData(version);
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
    isLoading: isLoading || !refreshCoordinator.isCurrentKey(queryKey),
    refetch: fetchData,
  };
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
