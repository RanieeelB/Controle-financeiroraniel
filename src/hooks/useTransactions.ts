import { useCallback, useEffect, useState } from 'react';
import { getFinancialDataVersion, subscribeFinancialDataChanged } from '../lib/financialEvents';
import { createFinancialRefreshCoordinator } from '../lib/financialRefreshCoordinator';
import { filterLegacyCarryoverTransactions } from '../lib/legacyCarryover';
import type { MonthRange } from '../lib/monthSelection';
import { supabase } from '../lib/supabase';
import { collectSupabasePages } from '../lib/supabasePagination';
import type { Transaction } from '../types/financial';

export function useTransactions(type?: 'entrada' | 'gasto', monthRange?: MonthRange) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCoordinator] = useState(() => createFinancialRefreshCoordinator<Transaction[]>());
  const startDate = monthRange?.startDate;
  const endDate = monthRange?.endDate;
  const queryKey = `${type ?? '*'}:${startDate ?? '*'}:${endDate ?? '*'}`;

  const fetchTransactions = useCallback((version = getFinancialDataVersion()) => refreshCoordinator.refresh({
    key: queryKey,
    version,
    onLoadingChange: setIsLoading,
    load: async () => {
      const data = await collectSupabasePages<Record<string, unknown>>((from, to) => {
        let query = supabase
          .from('transactions')
          .select('*, category:categories(*)')
          .order('date', { ascending: false })
          .order('id', { ascending: true });
        if (type) query = query.eq('type', type);
        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lt('date', endDate);
        return query.range(from, to);
      });

      return filterLegacyCarryoverTransactions(data.map((t: Record<string, unknown>) => ({
          ...t,
          amount: Number(t.amount),
        })) as Transaction[]);
    },
    apply: setTransactions,
    onError: error => console.error('Error fetching transactions:', error),
  }), [endDate, queryKey, refreshCoordinator, startDate, type]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void fetchTransactions(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [fetchTransactions]);

  useEffect(() => subscribeFinancialDataChanged(version => {
    void fetchTransactions(version);
  }), [fetchTransactions]);

  const totals = {
    total: transactions.reduce((s, t) => s + t.amount, 0),
    paid: transactions.filter(t => t.status === 'pago' || t.status === 'recebido').reduce((s, t) => s + t.amount, 0),
    pending: transactions.filter(t => t.status === 'pendente').reduce((s, t) => s + t.amount, 0),
    count: transactions.length,
    pendingCount: transactions.filter(t => t.status === 'pendente').length,
  };

  const categoryMap = new Map<string, number>();
  transactions.forEach(t => {
    const catName = t.category?.name || 'Sem categoria';
    categoryMap.set(catName, (categoryMap.get(catName) || 0) + t.amount);
  });
  let topCategory = { name: '—', amount: 0, percentage: 0 };
  if (categoryMap.size > 0) {
    const sorted = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
    topCategory = {
      name: sorted[0][0],
      amount: sorted[0][1],
      percentage: totals.total > 0 ? Math.round((sorted[0][1] / totals.total) * 100) : 0,
    };
  }

  return {
    transactions,
    isLoading: isLoading || !refreshCoordinator.isCurrentKey(queryKey),
    totals,
    topCategory,
    refetch: fetchTransactions,
  };
}
