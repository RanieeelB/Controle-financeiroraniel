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

export function useProjections(baseMonthKey = getCurrentMonthKey()) {
  const { bills: fixedBills } = useFixedBills();
  const { investments } = useInvestments();
  const { salarySetting } = useSalarySettings();
  const [allFutureItems, setAllFutureItems] = useState<FutureInvoiceItem[]>([]);

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

  const projections = useMemo(() => {
    // When daily_rate is configured, salary varies monthly and is launched manually
    const salaryAmount = salarySetting?.daily_rate ? 0 : (salarySetting?.amount ?? 0);

    return buildFinancialProjections({
      baseMonthKey,
      fixedBills,
      investments,
      futureInvoiceItems: allFutureItems,
      salaryAmount,
    });
  }, [baseMonthKey, fixedBills, investments, allFutureItems, salarySetting]);

  return { projections };
}
