import { useEffect } from 'react';
import { ensureMonthlySalaryTransaction } from '../lib/financialActions';

export function useAutoSalary(monthKey: string) {
  useEffect(() => {
    async function processSalary() {
      try {
        await ensureMonthlySalaryTransaction(monthKey);
      } catch (error) {
        console.error('Failed to ensure monthly salary transaction:', error);
      }
    }

    void processSalary();
  }, [monthKey]);
}
