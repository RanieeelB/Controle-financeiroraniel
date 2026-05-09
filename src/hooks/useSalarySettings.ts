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
