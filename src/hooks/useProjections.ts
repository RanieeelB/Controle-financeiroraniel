import { useMemo, useEffect, useState } from 'react';
import { useFixedBills } from './useFixedBills';
import { useInvestments } from './useInvestments';
import { buildMonthRange, getCurrentMonthKey, moveMonth } from '../lib/monthSelection';
import { useSalarySettings } from './useSalarySettings';
import { buildFinancialProjections, type MonthProjection } from '../lib/financialProjections';
import { supabase } from '../lib/supabase';

export interface FutureInvoiceItem {
  description: string;
  amount: number | string;
  date: string;
  current_installment: number;
  total_installments: number;
}

export type { MonthProjection };

interface SalaryEntry {
  monthKey: string;
  amount: number;
}

export function useProjections(baseMonthKey = getCurrentMonthKey()) {
  const { bills: fixedBills } = useFixedBills();
  const { investments } = useInvestments();
  const { salarySetting } = useSalarySettings();
  const [allFutureItems, setAllFutureItems] = useState<FutureInvoiceItem[]>([]);
  const [salaryEntries, setSalaryEntries] = useState<SalaryEntry[]>([]);

  useEffect(() => {
    async function fetchFutureItems() {
      const startDate = buildMonthRange(moveMonth(baseMonthKey, 1)).startDate;
      const endDate = buildMonthRange(moveMonth(baseMonthKey, 4)).startDate;

      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .gte('date', startDate)
        .lt('date', endDate);

      if (!error && data) {
        setAllFutureItems(data as FutureInvoiceItem[]);
      }
    }
    fetchFutureItems();
  }, [baseMonthKey]);

  useEffect(() => {
    async function fetchSalaryEntries() {
      const startDate = buildMonthRange(moveMonth(baseMonthKey, 1)).startDate;
      const endDate = buildMonthRange(moveMonth(baseMonthKey, 4)).startDate;

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, date')
        .eq('type', 'entrada')
        .ilike('description', 'Salário')
        .gte('date', startDate)
        .lt('date', endDate);

      if (!error && data) {
        const entries: SalaryEntry[] = data.map(t => ({
          monthKey: (t.date as string).slice(0, 7),
          amount: Number(t.amount),
        }));
        setSalaryEntries(entries);
      }
    }
    fetchSalaryEntries();
  }, [baseMonthKey]);

  const projections = useMemo(() => {
    const useDailyRate = Boolean(salarySetting?.daily_rate);

    return buildFinancialProjections({
      baseMonthKey,
      fixedBills,
      investments,
      futureInvoiceItems: allFutureItems,
      salaryAmount: useDailyRate ? 0 : (salarySetting?.amount ?? 0),
      salaryEntries: useDailyRate ? salaryEntries : undefined,
    });
  }, [baseMonthKey, fixedBills, investments, allFutureItems, salarySetting, salaryEntries]);

  return { projections };
}
