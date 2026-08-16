import { useCallback, useEffect, useState } from 'react';
import { subscribeFinancialDataChanged } from '../lib/financialEvents';
import {
  resolveDynamicFixedBills,
  summarizeFixedBills,
  type FixedBillPaymentRecord,
} from '../lib/fixedBillPayments';
import { supabase } from '../lib/supabase';
import type { FixedBill, DynamicFixedBill } from '../types/financial';
import { resolveMonthRange, type MonthRange } from '../lib/monthSelection';

export function useFixedBills(monthRange?: MonthRange) {
  const [bills, setBills] = useState<DynamicFixedBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const effectiveMonthRange = resolveMonthRange(monthRange, today);

      // 1. Fetch all fixed bills
      const { data: billsData, error: billsError } = await supabase
        .from('fixed_bills')
        .select('*, category:categories(*)')
        .order('due_day', { ascending: true });
        
      if (billsError) throw billsError;
      
      // 2. Fetch transactions for the current month that are fixed bill payments
      const txQuery = supabase
        .from('transactions')
        .select('id, notes, status, type, amount')
        .not('notes', 'is', null)
        .like('notes', 'fixed_bill:%')
        .gte('date', effectiveMonthRange.startDate)
        .lt('date', effectiveMonthRange.endDate);
      
      const { data: txData, error: txError } = await txQuery;
      if (txError) throw txError;

      if (billsData) {
        const dynamicBills = resolveDynamicFixedBills({
          bills: billsData as FixedBill[],
          payments: (txData ?? []) as FixedBillPaymentRecord[],
          monthKey: effectiveMonthRange.monthKey,
          today,
        }) as DynamicFixedBill[];
        
        setBills(dynamicBills);
      }
    } catch (error) {
      console.error('Error fetching fixed bills:', error);
    } finally {
      setIsLoading(false);
    }
  }, [monthRange]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchBills();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchBills]);

  useEffect(() => subscribeFinancialDataChanged(() => {
    void fetchBills();
  }), [fetchBills]);

  const totals = summarizeFixedBills(bills);

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
