import { useCallback, useEffect, useState } from 'react';
import { subscribeFinancialDataChanged } from '../lib/financialEvents';
import { supabase } from '../lib/supabase';
import type { SalarySetting } from '../types/financial';

export function useSalarySettings() {
  const [salarySetting, setSalarySetting] = useState<SalarySetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalarySetting = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('salary_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSalarySetting(null);
        return;
      }

      setSalarySetting({
        ...(data as SalarySetting),
        amount: Number(data.amount),
        day_of_month: Number(data.day_of_month),
        daily_rate: data.daily_rate ? Number(data.daily_rate) : null,
        work_start_day: data.work_start_day ? Number(data.work_start_day) : null,
        work_end_day: data.work_end_day ? Number(data.work_end_day) : null,
      });
    } catch (error) {
      console.error('Error fetching salary setting:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchSalarySetting();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchSalarySetting]);

  useEffect(() => subscribeFinancialDataChanged(() => {
    void fetchSalarySetting();
  }), [fetchSalarySetting]);

  return {
    salarySetting,
    isLoading,
    refetch: fetchSalarySetting,
  };
}
