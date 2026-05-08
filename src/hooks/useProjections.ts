import { useMemo, useEffect, useState } from 'react';
import { useFixedBills } from './useFixedBills';
import { useInvestments } from './useInvestments';
import { buildMonthRange, moveMonth, formatMonthLabel } from '../lib/monthSelection';
import { supabase } from '../lib/supabase';

export interface MonthProjection {
  monthKey: string;
  label: string;
  total: number;
  breakdown: {
    fixedBills: number;
    creditCards: number;
    investments: number;
  };
  details: {
    description: string;
    amount: number;
    type: 'fixed' | 'card' | 'investment';
  }[];
}

export function useProjections() {
  const { bills: fixedBills } = useFixedBills();
  const { investments } = useInvestments();
  const [allFutureItems, setAllFutureItems] = useState<any[]>([]);

  useEffect(() => {
    async function fetchFutureItems() {
      const today = new Date();
      // Start from the first day of next month
      const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0];
      // End at the first day of 4 months from now
      const endDate = new Date(today.getFullYear(), today.getMonth() + 4, 1).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .gte('date', startDate)
        .lt('date', endDate);

      if (!error && data) {
        setAllFutureItems(data);
      }
    }
    fetchFutureItems();
  }, []);

  const projections = useMemo(() => {
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const months = [
      moveMonth(currentMonthKey, 1),
      moveMonth(currentMonthKey, 2),
      moveMonth(currentMonthKey, 3),
    ];

    return months.map(monthKey => {
      const monthRange = buildMonthRange(monthKey);
      const label = formatMonthLabel(monthKey);
      
      const details: MonthProjection['details'] = [];
      
      // 1. Fixed Bills
      const fixedTotal = fixedBills.reduce((sum, bill) => {
        details.push({ description: bill.description, amount: bill.amount, type: 'fixed' });
        return sum + bill.amount;
      }, 0);

      // 2. Scheduled Investments
      const investmentTotal = investments.reduce((sum, inv) => {
        if (inv.monthly_contribution > 0) {
          details.push({ description: `Investimento: ${inv.name}`, amount: inv.monthly_contribution, type: 'investment' });
          return sum + inv.monthly_contribution;
        }
        return sum;
      }, 0);

      // 3. Credit Card Items for THIS specific month
      const monthItems = allFutureItems.filter(item => 
        item.date >= monthRange.startDate && item.date < monthRange.endDate
      );

      const cardTotal = monthItems.reduce((sum, item) => {
        details.push({ 
          description: `${item.description} (${item.current_installment}/${item.total_installments})`, 
          amount: Number(item.amount), 
          type: 'card' 
        });
        return sum + Number(item.amount);
      }, 0);

      return {
        monthKey,
        label,
        total: fixedTotal + cardTotal + investmentTotal,
        breakdown: {
          fixedBills: fixedTotal,
          creditCards: cardTotal,
          investments: investmentTotal,
        },
        details: details.sort((a, b) => b.amount - a.amount),
      };
    });
  }, [fixedBills, investments, allFutureItems]);

  console.log('Projections calculated:', projections);

  return { projections };
}
