import { useEffect } from 'react';
import { ensureMonthlyBalanceCarryoverTransaction } from '../lib/financialActions';

const processingMonths = new Set<string>();

export function useAutoBalanceCarryover(monthKey: string) {
  useEffect(() => {
    async function processBalanceCarryover() {
      if (processingMonths.has(monthKey)) return;
      processingMonths.add(monthKey);

      try {
        await ensureMonthlyBalanceCarryoverTransaction(monthKey);
      } catch (error) {
        console.error('Failed to ensure monthly balance carryover transaction:', error);
      } finally {
        processingMonths.delete(monthKey);
      }
    }

    void processBalanceCarryover();
  }, [monthKey]);
}
