import { useCallback, useEffect, useState } from 'react';
import { subscribeFinancialDataChanged } from '../lib/financialEvents';
import { supabase } from '../lib/supabase';
import type { Investment, InvestmentCategory, InvestmentDeposit, Transaction } from '../types/financial';

export function useInvestments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [deposits, setDeposits] = useState<InvestmentDeposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvestments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (data) {
        setInvestments(data.map((i: Record<string, unknown>) => ({
          ...i,
          amount_invested: Number(i.amount_invested),
          current_value: Number(i.current_value),
          return_percentage: Number(i.return_percentage),
          monthly_contribution: Number(i.monthly_contribution || 0),
          last_auto_contribution_at: i.last_auto_contribution_at as string | null,
        })) as Investment[]);
      }

      const { data: depositsData, error: depositsError } = await supabase
        .from('investment_deposits')
        .select('*')
        .order('date', { ascending: false });

      if (depositsError) {
        if (isMissingInvestmentDepositsTable(depositsError)) {
          setDeposits(await fetchDepositsFromTransactions());
        } else {
          throw depositsError;
        }
      } else {
        setDeposits((depositsData ?? []).map((deposit: Record<string, unknown>) => ({
          ...deposit,
          amount: Number(deposit.amount),
        })) as InvestmentDeposit[]);
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchInvestments();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchInvestments]);

  useEffect(() => subscribeFinancialDataChanged(() => {
    void fetchInvestments();
  }), [fetchInvestments]);

  const totalInvested = investments.reduce((s, i) => s + i.amount_invested, 0);
  const totalCurrentValue = investments.reduce((s, i) => s + i.current_value, 0);
  const totalReturn = totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0;

  // Group by category
  const categoryLabels: Record<InvestmentCategory, string> = {
    renda_fixa: 'Renda Fixa',
    acoes: 'Ações',
    fiis: 'FIIs',
    cripto: 'Cripto',
  };

  const grouped = investments.reduce((acc, inv) => {
    if (!acc[inv.category]) acc[inv.category] = [];
    acc[inv.category].push(inv);
    return acc;
  }, {} as Record<InvestmentCategory, Investment[]>);

  const categoryTotals = (Object.keys(grouped) as InvestmentCategory[]).map(cat => ({
    category: cat,
    label: categoryLabels[cat],
    total: grouped[cat].reduce((s, i) => s + i.current_value, 0),
    items: grouped[cat],
    percentage: totalCurrentValue > 0 ? Math.round((grouped[cat].reduce((s, i) => s + i.current_value, 0) / totalCurrentValue) * 100) : 0,
  }));

  function getInvestmentDeposits(investmentId: string) {
    return deposits
      .filter(deposit => deposit.investment_id === investmentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  function getLastDeposit(investmentId: string) {
    return getInvestmentDeposits(investmentId)[0] ?? null;
  }

  return {
    investments,
    deposits,
    isLoading,
    totalInvested,
    totalCurrentValue,
    totalReturn,
    categoryTotals,
    getInvestmentDeposits,
    getLastDeposit,
    refetch: fetchInvestments,
  };
}

async function fetchDepositsFromTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .like('notes', 'investment_deposit:%')
    .order('date', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((transaction: Record<string, unknown>) => {
    const typedTransaction = {
      ...transaction,
      amount: Number(transaction.amount),
    } as Transaction;

    return {
      id: typedTransaction.id,
      user_id: typedTransaction.user_id,
      investment_id: typedTransaction.notes?.replace('investment_deposit:', '') ?? '',
      amount: typedTransaction.amount,
      date: typedTransaction.date,
      notes: null,
      created_at: typedTransaction.created_at,
    };
  }) as InvestmentDeposit[];
}

function isMissingInvestmentDepositsTable(error: { code?: string; message?: string }) {
  return error.code === '42P01'
    || error.message?.includes('investment_deposits') === true
    || error.message?.includes('Could not find the table') === true;
}
