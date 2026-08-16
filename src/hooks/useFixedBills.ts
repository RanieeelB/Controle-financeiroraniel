import { useCallback, useEffect, useState } from 'react';
import { getFinancialDataVersion, subscribeFinancialDataChanged } from '../lib/financialEvents';
import { createFinancialRefreshCoordinator } from '../lib/financialRefreshCoordinator';
import {
  resolveDynamicFixedBills,
  summarizeFixedBills,
  type FixedBillPaymentRecord,
} from '../lib/fixedBillPayments';
import { supabase } from '../lib/supabase';
import type { FixedBill, DynamicFixedBill } from '../types/financial';
import { resolveMonthRange, type MonthRange } from '../lib/monthSelection';
import { collectSupabasePages } from '../lib/supabasePagination';

export function useFixedBills(monthRange?: MonthRange) {
  const [bills, setBills] = useState<DynamicFixedBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCoordinator] = useState(() => createFinancialRefreshCoordinator<DynamicFixedBill[]>());
  const effectiveMonthRange = resolveMonthRange(monthRange);
  const queryKey = `${effectiveMonthRange.startDate}:${effectiveMonthRange.endDate}`;

  const fetchBills = useCallback((version = getFinancialDataVersion()) => refreshCoordinator.refresh({
    key: queryKey,
    version,
    onLoadingChange: setIsLoading,
    load: async () => {
        const today = new Date();
        // 1. Fetch all fixed bills
        const billsData = await collectSupabasePages<FixedBill>((from, to) => supabase
          .from('fixed_bills')
          .select('*, category:categories(*)')
          .order('due_day', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to));
      
        // 2. Fetch transactions for the current month that are fixed bill payments
        const txData = await collectSupabasePages<FixedBillPaymentRecord>((from, to) => supabase
          .from('transactions')
          .select('id, notes, status, type, amount')
          .not('notes', 'is', null)
          .like('notes', 'fixed_bill:%')
          .gte('date', effectiveMonthRange.startDate)
          .lt('date', effectiveMonthRange.endDate)
          .order('id', { ascending: true })
          .range(from, to));

        return resolveDynamicFixedBills({
          bills: billsData,
          payments: txData,
          monthKey: effectiveMonthRange.monthKey,
          today,
        }) as DynamicFixedBill[];
    },
    apply: setBills,
    onError: error => console.error('Error fetching fixed bills:', error),
  }), [effectiveMonthRange.endDate, effectiveMonthRange.monthKey, effectiveMonthRange.startDate, queryKey, refreshCoordinator]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchBills();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchBills]);

  useEffect(() => subscribeFinancialDataChanged(version => {
    void fetchBills(version);
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

  return {
    bills,
    isLoading: isLoading || !refreshCoordinator.isCurrentKey(queryKey),
    totals,
    categoryBreakdown,
    refetch: fetchBills,
  };
}
