import { useCallback, useEffect, useState } from 'react';
import { subscribeFinancialDataChanged } from '../lib/financialEvents';
import { supabase } from '../lib/supabase';
import type { FinancialGoal } from '../types/financial';

export function useFinancialGoals() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (data) {
        setGoals(data.map((g: Record<string, unknown>) => ({
          ...g,
          target_amount: Number(g.target_amount),
          current_amount: Number(g.current_amount),
        })) as FinancialGoal[]);
      }
    } catch (error) {
      console.error('Error fetching financial goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchGoals();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchGoals]);

  useEffect(() => subscribeFinancialDataChanged(() => {
    void fetchGoals();
  }), [fetchGoals]);

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return { goals, isLoading, totalTarget, totalSaved, overallProgress, refetch: fetchGoals };
}
