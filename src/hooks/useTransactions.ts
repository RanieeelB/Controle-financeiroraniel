import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../types/financial';

export function useTransactions(type?: 'entrada' | 'gasto') {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchTransactions() {
    setIsLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .order('date', { ascending: false });
      
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        setTransactions(data.map((t: Record<string, unknown>) => ({
          ...t,
          amount: Number(t.amount),
        })) as Transaction[]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, [type]);

  const totals = {
    total: transactions.reduce((s, t) => s + t.amount, 0),
    paid: transactions.filter(t => t.status === 'pago' || t.status === 'recebido').reduce((s, t) => s + t.amount, 0),
    pending: transactions.filter(t => t.status === 'pendente').reduce((s, t) => s + t.amount, 0),
    count: transactions.length,
    pendingCount: transactions.filter(t => t.status === 'pendente').length,
  };

  // Find top category
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

  return { transactions, isLoading, totals, topCategory, refetch: fetchTransactions };
}
