import { useCallback, useEffect, useState } from 'react';
import { subscribeFinancialDataChanged } from '../lib/financialEvents';
import { supabase } from '../lib/supabase';
import type { Investment, InvestmentCategory } from '../types/financial';

export function useInvestments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
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
        })) as Investment[]);
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

  return { investments, isLoading, totalInvested, totalCurrentValue, totalReturn, categoryTotals, refetch: fetchInvestments };
}
