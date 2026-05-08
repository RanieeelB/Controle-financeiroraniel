import { useCallback, useEffect, useState } from 'react';
import { subscribeFinancialDataChanged } from '../lib/financialEvents';
import { supabase } from '../lib/supabase';
import type { FixedBill, DynamicFixedBill } from '../types/financial';
import type { MonthRange } from '../lib/monthSelection';

export function useFixedBills(monthRange?: MonthRange) {
  const [bills, setBills] = useState<DynamicFixedBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch all fixed bills
      const { data: billsData, error: billsError } = await supabase
        .from('fixed_bills')
        .select('*, category:categories(*)')
        .order('due_day', { ascending: true });
        
      if (billsError) throw billsError;
      
      // 2. Fetch transactions for the current month that are fixed bill payments
      let txQuery = supabase
        .from('transactions')
        .select('notes, status')
        .not('notes', 'is', null)
        .like('notes', 'fixed_bill:%');
        
      if (monthRange) {
        txQuery = txQuery.gte('date', monthRange.startDate).lt('date', monthRange.endDate);
      }
      
      const { data: txData, error: txError } = await txQuery;
      if (txError) throw txError;

      // Create a set of paid bill IDs for the selected month
      const paidBillIds = new Set(
        (txData || [])
          .filter(tx => tx.status === 'pago')
          .map(tx => tx.notes?.replace('fixed_bill:', ''))
      );

      const today = new Date();
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentYear = today.getFullYear();
      
      const [viewYear, viewMonth] = monthRange 
        ? monthRange.monthKey.split('-').map(Number) 
        : [currentYear, currentMonth];

      const isViewingCurrentMonth = viewYear === currentYear && viewMonth === currentMonth;
      const isViewingPastMonth = viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth);

      if (billsData) {
        const dynamicBills = billsData.map((b: FixedBill) => {
          const isPaidThisMonth = paidBillIds.has(b.id);
          let dynamicStatus: 'pago' | 'pendente' | 'atrasado' = 'pendente';
          let daysOverdue = 0;

          if (isPaidThisMonth) {
            dynamicStatus = 'pago';
          } else {
            if (isViewingPastMonth) {
              dynamicStatus = 'atrasado';
            } else if (isViewingCurrentMonth) {
              const dueDay = b.due_day;
              const currentDay = today.getDate();
              if (currentDay > dueDay) {
                dynamicStatus = 'atrasado';
                daysOverdue = currentDay - dueDay;
              }
            } else {
              dynamicStatus = 'pendente';
            }
          }

          return {
            ...b,
            amount: Number(b.amount),
            dynamicStatus,
            daysOverdue
          };
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

  const totals = {
    total: bills.reduce((s, b) => s + b.amount, 0),
    paid: bills.filter(b => b.dynamicStatus === 'pago').reduce((s, b) => s + b.amount, 0),
    paidCount: bills.filter(b => b.dynamicStatus === 'pago').length,
    pending: bills.filter(b => b.dynamicStatus === 'pendente' || b.dynamicStatus === 'atrasado').reduce((s, b) => s + b.amount, 0),
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
