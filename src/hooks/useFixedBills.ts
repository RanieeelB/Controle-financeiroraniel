import { useCallback, useEffect, useState } from 'react';
import { subscribeFinancialDataChanged } from '../lib/financialEvents';
import { supabase } from '../lib/supabase';
import type { FixedBill } from '../types/financial';

export function useFixedBills() {
  const [bills, setBills] = useState<FixedBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fixed_bills')
        .select('*, category:categories(*)')
        .order('due_day', { ascending: true });
      if (error) throw error;
      if (data) {
        setBills(data.map((b: Record<string, unknown>) => ({
          ...b,
          amount: Number(b.amount),
        })) as FixedBill[]);
      }
    } catch (error) {
      console.error('Error fetching fixed bills:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchBills();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchBills]);

  useEffect(() => subscribeFinancialDataChanged(() => {
    void fetchBills();
  }), [fetchBills]);

  const totals = {
    total: bills.reduce((s, b) => s + b.amount, 0),
    paid: bills.filter(b => b.status === 'pago').reduce((s, b) => s + b.amount, 0),
    paidCount: bills.filter(b => b.status === 'pago').length,
    pending: bills.filter(b => b.status === 'pendente' || b.status === 'atrasado').reduce((s, b) => s + b.amount, 0),
    count: bills.length,
  };

  // Group by category
  const categoryMap = new Map<string, number>();
  bills.forEach(b => {
    const catName = b.category?.name || 'Outros';
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + b.amount);
  });
  const categoryBreakdown = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totals.total > 0 ? Math.round((amount / totals.total) * 100) : 0,
    }));

  return { bills, isLoading, totals, categoryBreakdown, refetch: fetchBills };
}
