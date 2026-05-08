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

import type { MonthRange } from '../lib/monthSelection';

const fallbackExpenseColors = ['#75ff9e', '#7bd0ff', '#ffba79', '#859585', '#ffb4ab'];

export function useDashboardData(monthRange?: MonthRange) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [summaryCards, setSummaryCards] = useState<SummaryCards>(emptySummary);
  const [balanceEvolution, setBalanceEvolution] = useState<BalanceEvolutionData[]>([]);
  const [categoryExpense, setCategoryExpense] = useState<CategoryExpenseData[]>([]);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState<MonthlyAnalysis>(defaultAnalysis);
  const [isLoading, setIsLoading] = useState(true);

  const startDate = monthRange?.startDate;
  const endDate = monthRange?.endDate;

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      let txQuery = supabase.from('transactions').select('*, category:categories(*)').order('date', { ascending: false });
      if (startDate) txQuery = txQuery.gte('date', startDate);
      if (endDate) txQuery = txQuery.lt('date', endDate);

      let invoiceQuery = supabase.from('invoice_items').select('amount');
      if (startDate) invoiceQuery = invoiceQuery.gte('date', startDate);
      if (endDate) invoiceQuery = invoiceQuery.lt('date', endDate);

      const [txResult, billsResult, cardsResult, invoiceResult, goalsResult] = await Promise.all([
        txQuery,
        supabase.from('fixed_bills').select('*, category:categories(*)').order('due_day', { ascending: true }),
        supabase.from('credit_cards').select('*').order('created_at', { ascending: true }),
        invoiceQuery,
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

      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      const [viewYear, viewMonth] = monthRange 
        ? monthRange.monthKey.split('-').map(Number) 
        : [currentYear, currentMonth];

      const isViewingCurrentMonth = viewYear === currentYear && viewMonth === currentMonth;
      const isViewingPastMonth = viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth);

      // Create a set of paid bill IDs for the selected month
      const paidBillIds = new Set(
        mappedTransactions
          .filter(tx => tx.notes?.includes('fixed_bill:'))
          .map(tx => tx.notes?.replace('fixed_bill:', ''))
      );

      const mappedBills = (billsResult.data ?? []).map((bill: Record<string, unknown>) => {
        const amount = Number(bill.amount);
        const isPaidThisMonth = paidBillIds.has(bill.id as string);
        let dynamicStatus: 'pago' | 'pendente' | 'atrasado' = 'pendente';
        let daysOverdue = 0;

        if (isPaidThisMonth) {
          dynamicStatus = 'pago';
        } else {
          if (isViewingPastMonth) {
            dynamicStatus = 'atrasado';
          } else if (isViewingCurrentMonth) {
            const dueDay = Number(bill.due_day);
            const currentDay = today.getDate();
            if (currentDay > dueDay) {
              dynamicStatus = 'atrasado';
              daysOverdue = currentDay - dueDay;
            }
          }
        }

        return {
          ...bill,
          amount,
          dynamicStatus,
          daysOverdue
        };
      }) as any[];

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
  }, [startDate, endDate]);

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
  const byDay = new Map<string, number>();

  // Group the net amount for each day
  transactions.forEach(transaction => {
    const key = transaction.date; // YYYY-MM-DD
    const signedAmount = transaction.type === 'entrada' ? transaction.amount : -transaction.amount;
    byDay.set(key, (byDay.get(key) ?? 0) + signedAmount);
  });

  // Sort days chronologically
  const sortedDays = [...byDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right));

  // Calculate cumulative balance
  let runningBalance = 0;
  return sortedDays.map(([date, dayNet]) => {
    runningBalance += dayNet;
    const day = date.split('-')[2]; // Get only the day part
    return {
      label: day,
      balance: runningBalance,
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
